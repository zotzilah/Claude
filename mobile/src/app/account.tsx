import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { cleanCode, isCode, isEmail, normaliseEmail, resendWaitMs, type SignInError } from '@/domain/sign-in';
import { accountsAvailable, deleteAccount, sendCode, signOut, useParent, verifyCode } from '@/state/auth';
import { useStrings } from '@/state/locale';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

type Step = 'email' | 'code';

/**
 * Parent account: sign in with an emailed code, sign out, or delete everything
 * (the privacy policy promises the last one is always in Settings).
 */
export default function Account() {
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const t = useStrings();
  const parent = useParent();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SignInError | 'bad-email' | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const wait = resendWaitMs(sentAt, now);

  // Count down to "Send a new code".
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [wait]);

  if (list.kidMode) return <Redirect href="/kid" />;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const send = async () => {
    if (!isEmail(email)) {
      setError('bad-email');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await sendCode(email);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSentAt(Date.now());
    setNow(Date.now());
    setStep('code');
  };

  const verify = async (typed = code) => {
    if (!isCode(typed)) return;
    setBusy(true);
    setError(null);
    const result = await verifyCode(email, cleanCode(typed));
    setBusy(false);
    if (result.ok) close();
    else setError(result.error);
  };

  const remove = async () => {
    setBusy(true);
    const result = await deleteAccount();
    setBusy(false);
    if (result.ok) {
      // The lists on the server are gone; start this phone afresh too.
      list.reset();
      setDeleted(true);
    } else {
      setError(result.error);
    }
  };

  const errorText = error === 'bad-email' ? t.account.badEmail : error ? t.account.errors[error] : null;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.head, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.kicker}>{t.account.kicker}</Text>
        <Text style={styles.heading} accessibilityRole="header">
          {t.account.heading}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {deleted ? (
          <Text style={styles.help}>{t.account.deleted}</Text>
        ) : !accountsAvailable() ? (
          <Text style={styles.help}>{t.account.notSetUp}</Text>
        ) : parent ? (
          <>
            <Text style={styles.signedIn}>{t.account.signedInAs(parent.email)}</Text>
            <BigButton label={t.account.signOut} tone="yellow" onPress={() => signOut()} />
            <View style={styles.danger}>
              {confirmingDelete ? (
                <>
                  <Text style={styles.warning}>{t.account.deleteWarning}</Text>
                  <View style={styles.row}>
                    <BigButton label={t.common.cancel} tone="yellow" onPress={() => setConfirmingDelete(false)} />
                    <BigButton label={t.account.deleteConfirm} onPress={remove} grow />
                  </View>
                </>
              ) : (
                <TextLink label={t.account.delete} danger onPress={() => setConfirmingDelete(true)} />
              )}
            </View>
          </>
        ) : step === 'email' ? (
          <>
            <Text style={styles.help}>{t.account.why}</Text>
            <Text style={styles.label} nativeID="email-label">
              {t.account.email}
            </Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              onSubmitEditing={send}
              placeholder={t.account.emailExample}
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              returnKeyType="send"
              style={styles.input}
              accessibilityLabelledBy="email-label"
            />
            <BigButton label={busy ? t.account.sending : t.account.sendCode} onPress={busy ? () => undefined : send} />
          </>
        ) : (
          <>
            <Text style={styles.help}>{t.account.codeSent(normaliseEmail(email))}</Text>
            <Text style={styles.label} nativeID="code-label">
              {t.account.code}
            </Text>
            <TextInput
              value={code}
              onChangeText={(text) => {
                const cleaned = cleanCode(text);
                setCode(cleaned);
                setError(null);
                // Six digits is a whole code: sign in without another tap.
                if (cleaned.length === 6) verify(cleaned);
              }}
              placeholder="123456"
              placeholderTextColor={colors.inkSoft}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={12}
              style={[styles.input, styles.code]}
              accessibilityLabelledBy="code-label"
            />
            <BigButton label={busy ? t.account.checking : t.account.signIn} onPress={busy ? () => undefined : () => verify()} />
            <View style={styles.row}>
              <TextLink
                label={wait > 0 ? t.account.resendIn(Math.ceil(wait / 1000)) : t.account.resend}
                disabled={wait > 0 || busy}
                onPress={send}
              />
              <TextLink
                label={t.account.differentEmail}
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                }}
              />
            </View>
          </>
        )}

        {errorText && (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {errorText}
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <BigButton label={t.common.back} tone="yellow" onPress={close} />
      </View>
    </KeyboardAvoidingView>
  );
}

function TextLink(props: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      hitSlop={8}
      style={styles.textLink}
    >
      <Text style={[styles.textLinkLabel, props.danger && styles.dangerText, props.disabled && styles.disabled]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper2 },
  head: { backgroundColor: colors.red, paddingHorizontal: space.lg, paddingBottom: space.lg },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.4, color: colors.paper, opacity: 0.9 },
  heading: { fontFamily: fonts.display, fontSize: 28, color: colors.paper, marginTop: 4 },
  body: { padding: space.lg, gap: space.md },
  help: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.ink },
  label: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginTop: space.sm },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontFamily: fonts.bodySemi,
    fontSize: 18,
    color: colors.ink,
    minWidth: 0,
  },
  code: { fontFamily: fonts.display, fontSize: 28, letterSpacing: 8, textAlign: 'center' },
  signedIn: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink },
  danger: { marginTop: space.xl, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: colors.rule, gap: space.md },
  warning: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21, color: colors.redDeep },
  error: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.red },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
  textLink: { minHeight: 44, justifyContent: 'center' },
  textLinkLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.blue, textDecorationLine: 'underline' },
  dangerText: { color: colors.red },
  disabled: { opacity: 0.45 },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.rule },
});
