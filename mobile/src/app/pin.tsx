import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { PinPad } from '@/components/pin-pad';
import { isEasyPin, lockedForMs, NO_ATTEMPTS, PIN_LENGTH, type AttemptState } from '@/domain/pin';
import { authenticateParent, canUseBiometrics, checkPin, loadAttempts, setPin } from '@/state/parent-pin';
import { useStrings } from '@/state/locale';
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
  const t = useStrings();
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
      setMessage(t.pin.mismatch);
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
      title={first === null ? t.pin.chooseTitle : t.pin.confirmTitle}
      subtitle={t.pin.chooseSubtitle(list.settings.circlerName || t.common.yourChild)}
      message={easyWarning ? t.pin.easy : message}
    >
      <PinPad value={value} onChange={onChange} errorCount={errors} disabled={easyWarning} />
      {easyWarning && (
        <View style={styles.row}>
          <BigButton label={t.pin.pickAnother} tone="yellow" onPress={() => { setEasyWarning(false); setValue(''); }} />
          <BigButton label={t.pin.useAnyway} onPress={() => confirmFirst(value)} grow />
        </View>
      )}
      <TextButton label={t.common.cancel} onPress={() => router.back()} />
    </Gate>
  );
}

function UnlockPin() {
  const list = useWishlist();
  const t = useStrings();
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
      title={t.pin.unlockTitle}
      subtitle={t.pin.unlockSubtitle}
      message={lockedMs > 0 ? t.pin.wait(Math.ceil(lockedMs / 1000)) : errors ? t.pin.wrong : null}
    >
      <PinPad value={value} onChange={onChange} errorCount={errors} disabled={lockedMs > 0} />
      {biometrics && <TextButton label={t.pin.biometrics} onPress={() => tryBiometrics(false)} />}
      <View style={styles.row}>
        <TextButton
          label={t.pin.backToCircling}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/kid'))}
        />
        {biometrics && <TextButton label={t.pin.forgot} onPress={() => tryBiometrics(true)} />}
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
