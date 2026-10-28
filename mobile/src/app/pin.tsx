import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { PinPad } from '@/components/pin-pad';
import { isEasyPin, lockedForMs, NO_ATTEMPTS, PIN_LENGTH, type AttemptState } from '@/domain/pin';
import { authenticateParent, canUseBiometrics, checkPin, loadAttempts, setPin } from '@/state/parent-pin';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, space } from '@/theme/tokens';

/**
 * The grown-ups' gate (brief §6).
 * `?mode=create`: choose a PIN before handing the phone over, then enter Kid Mode.
 * `?mode=unlock` (default): PIN, Face ID or fingerprint to leave Kid Mode.
 */
export default function PinScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  return mode === 'create' ? <CreatePin /> : <UnlockPin />;
}

function CreatePin() {
  const list = useWishlist();
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [easyWarning, setEasyWarning] = useState(false);
  const [errors, setErrors] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const confirmFirst = (pin: string) => {
    setFirst(pin);
    setValue('');
    setEasyWarning(false);
    setMessage(null);
  };

  const onChange = async (next: string) => {
    setValue(next);
    if (next.length < PIN_LENGTH) return;
    if (first === null) {
      if (isEasyPin(next)) setEasyWarning(true);
      else confirmFirst(next);
      return;
    }
    if (next !== first) {
      setErrors((n) => n + 1);
      setMessage("Those didn't match. Let's start again.");
      setFirst(null);
      setValue('');
      return;
    }
    await setPin(next);
    list.setKidMode(true);
    router.replace('/kid');
  };

  return (
    <Gate
      title={first === null ? 'Choose a grown-ups PIN' : 'Type it again'}
      subtitle={`You'll need this to leave Kid Mode, so ${list.settings.circlerName || 'your child'} can't wander off into settings.`}
      message={easyWarning ? "That one's easy to guess. Kids are sneaky." : message}
    >
      <PinPad value={value} onChange={onChange} errorCount={errors} disabled={easyWarning} />
      {easyWarning && (
        <View style={styles.row}>
          <BigButton label="Pick another" tone="yellow" onPress={() => { setEasyWarning(false); setValue(''); }} />
          <BigButton label="Use it anyway" onPress={() => confirmFirst(value)} grow />
        </View>
      )}
      <TextButton label="Cancel" onPress={() => router.back()} />
    </Gate>
  );
}

function UnlockPin() {
  const list = useWishlist();
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState(0);
  const [attempts, setAttempts] = useState<AttemptState>(NO_ATTEMPTS);
  const [now, setNow] = useState(() => Date.now());
  const [biometrics, setBiometrics] = useState(false);
  const lockedMs = lockedForMs(attempts, now);

  const leave = () => {
    list.setKidMode(false);
    // Pop back to the catalogue already underneath, so "back" can't return to Kid Mode screens.
    router.dismissTo('/');
  };

  useEffect(() => {
    loadAttempts().then(setAttempts);
    canUseBiometrics().then(setBiometrics);
  }, []);

  // Tick the cool-down timer once a second while locked.
  useEffect(() => {
    if (lockedMs <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lockedMs]);

  const onChange = async (next: string) => {
    setValue(next);
    if (next.length < PIN_LENGTH) return;
    const result = await checkPin(next, Date.now());
    if (result.ok) {
      leave();
      return;
    }
    setAttempts(result.attempts);
    setNow(Date.now());
    setErrors((n) => n + 1);
    setValue('');
  };

  const tryBiometrics = async (allowPhonePasscode: boolean) => {
    if (await authenticateParent(allowPhonePasscode)) leave();
  };

  return (
    <Gate
      title="Grown-ups only"
      subtitle="Type your PIN to leave Kid Mode."
      message={lockedMs > 0 ? `Too many tries. Wait ${Math.ceil(lockedMs / 1000)} seconds.` : errors ? 'Not quite. Try again.' : null}
    >
      <PinPad value={value} onChange={onChange} errorCount={errors} disabled={lockedMs > 0} />
      {biometrics && <TextButton label="Use Face ID or fingerprint" onPress={() => tryBiometrics(false)} />}
      <View style={styles.row}>
        <TextButton
          label="◀ Back to circling"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/kid'))}
        />
        {biometrics && <TextButton label="Forgot PIN?" onPress={() => tryBiometrics(true)} />}
      </View>
    </Gate>
  );
}

function Gate(props: { title: string; subtitle: string; message: string | null; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }]}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.title} accessibilityRole="header">
        {props.title}
      </Text>
      <Text style={styles.subtitle}>{props.subtitle}</Text>
      <Text style={styles.message} accessibilityLiveRegion="assertive">
        {props.message ?? ' '}
      </Text>
      {props.children}
    </View>
  );
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={styles.textButton}>
      <Text style={styles.textButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.blueDeep, alignItems: 'center', paddingHorizontal: space.lg, gap: space.md },
  lock: { fontSize: 40 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.paper, textAlign: 'center' },
  subtitle: { fontFamily: fonts.body, fontSize: 16, lineHeight: 21, color: '#c9d4f2', textAlign: 'center', maxWidth: 320 },
  message: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.yellow, textAlign: 'center', minHeight: 22 },
  row: { flexDirection: 'row', gap: space.lg, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  textButton: { paddingVertical: space.sm },
  textButtonLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.yellow, textDecorationLine: 'underline' },
});
