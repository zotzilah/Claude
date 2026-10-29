import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { cleanCode, isCode, isEmail, normaliseEmail, resendWaitMs, type SignInError } from '@/domain/sign-in';
import { loadBackupCode, saveBackupCode } from '@/state/backup-code';
import { accountsAvailable, deleteAccount, savedOnline, sendCode, signOut, useParent, verifyCode } from '@/state/auth';
import { sendFeedback } from '@/state/feedback';
import { useStrings } from '@/state/locale';
import { newBackupCode } from '@/state/remote';
import { pushAllowed, pushAvailable, turnOnPushes, type PushResult } from '@/state/push';
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
  const [confirmingNewLink, setConfirmingNewLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [pushes, setPushes] = useState<PushResult | 'off' | 'asking'>('off');
  const [backupCode, setBackupCode] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupFailed, setBackupFailed] = useState(false);
  const [confirmingNewCode, setConfirmingNewCode] = useState(false);
  const wait = resendWaitMs(sentAt, now);

  // Count down to "Send a new code".
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [wait]);

  // Notifications already allowed on this phone show as on.
  useEffect(() => {
    pushAllowed().then((allowed) => allowed && setPushes('on'));
  }, []);

  // A backup code made earlier on this phone is shown again.
  const listId = list.list.id;
  useEffect(() => {
    loadBackupCode(listId).then(setBackupCode);
  }, [listId]);

  const makeBackupCode = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    setBackupFailed(false);
    const result = await newBackupCode(listId);
    setBackupBusy(false);
    setConfirmingNewCode(false);
    if (!result.ok) {
      setBackupFailed(true);
      return;
    }
    setBackupCode(result.value);
    await saveBackupCode(listId, result.value);
  };

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
        ) : !accountsAvailable() || parent ? (
          <>
            {parent ? (
              <>
                <Text style={styles.signedIn}>{t.account.signedInAs(parent.email)}</Text>
                <BigButton label={t.account.signOut} tone="yellow" onPress={() => signOut()} />
              </>
            ) : (
              <Text style={styles.help}>{savedOnline() ? t.account.savedOnline : t.account.notSetUp}</Text>
            )}
            {list.shareUrl && (
              <View style={styles.linkBox}>
                <Text style={styles.label}>{t.account.familyLink}</Text>
                <Text style={styles.link} selectable>
                  {list.shareUrl}
                </Text>
                <Text style={styles.note}>{t.account.familyLinkHint}</Text>
                {confirmingNewLink ? (
                  <>
                    <Text style={styles.warning}>{t.account.newLinkWarning}</Text>
                    <View style={styles.row}>
                      <BigButton label={t.common.cancel} tone="yellow" onPress={() => setConfirmingNewLink(false)} />
                      <BigButton
                        label={t.account.newLinkConfirm}
                        grow
                        onPress={async () => {
                          const ok = await list.renewShareLink();
                          setConfirmingNewLink(false);
                          setLinkMessage(ok ? t.account.newLinkDone : t.account.newLinkFailed);
                        }}
                      />
                    </View>
                  </>
                ) : (
                  <TextLink
                    label={t.account.newLink}
                    onPress={() => {
                      setLinkMessage(null);
                      setConfirmingNewLink(true);
                    }}
                  />
                )}
                {linkMessage && (
                  <Text style={styles.note} accessibilityLiveRegion="polite">
                    {linkMessage}
                  </Text>
                )}
              </View>
            )}
            {savedOnline() && list.shareUrl && (
              <View style={styles.linkBox}>
                <Text style={styles.label}>{t.account.backup}</Text>
                <Text style={styles.note}>{t.account.backupHint}</Text>
                {backupCode ? (
                  <Text style={styles.backupCode} selectable accessibilityLabel={t.account.backupA11y(backupCode)}>
                    {backupCode}
                  </Text>
                ) : (
                  <BigButton label={backupBusy ? t.account.backupMaking : t.account.backupShow} tone="yellow" onPress={makeBackupCode} />
                )}
                {backupCode &&
                  (confirmingNewCode ? (
                    <>
                      <Text style={styles.warning}>{t.account.backupNewWarning}</Text>
                      <View style={styles.row}>
                        <BigButton label={t.common.cancel} tone="yellow" onPress={() => setConfirmingNewCode(false)} />
                        <BigButton label={t.account.backupNewConfirm} grow onPress={makeBackupCode} />
                      </View>
                    </>
                  ) : (
                    <TextLink label={t.account.backupNew} onPress={() => setConfirmingNewCode(true)} />
                  ))}
                {backupFailed && (
                  <Text style={styles.warning} accessibilityLiveRegion="polite">
                    {t.account.backupFailed}
                  </Text>
                )}
              </View>
            )}
            {pushAvailable() && savedOnline() && (
              <View style={styles.linkBox}>
                <Text style={styles.label}>{t.account.pushes}</Text>
                <Text style={styles.note}>{t.account.pushesHint}</Text>
                {pushes === 'on' ? (
                  <Text style={styles.signedIn}>{t.account.pushesOn}</Text>
                ) : (
                  <BigButton
                    label={t.account.pushesTurnOn}
                    tone="yellow"
                    onPress={async () => {
                      if (pushes === 'asking') return;
                      setPushes('asking');
                      setPushes(await turnOnPushes());
                    }}
                  />
                )}
                {(pushes === 'denied' || pushes === 'failed') && (
                  <Text style={styles.warning} accessibilityLiveRegion="polite">
                    {pushes === 'denied' ? t.account.pushesDenied : t.account.pushesFailed}
                  </Text>
                )}
              </View>
            )}
            {/* The privacy policy promises this is always here whenever anything is stored online. */}
            {(parent || savedOnline()) && (
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
            )}
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

        <View style={styles.feedback}>
          <TextLink label={t.feedback.link} onPress={() => sendFeedback(t.feedback.subject, t.feedback.prompt, 'App')} />
        </View>

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
  kicker: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.4, color: colors.paper },
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
  linkBox: { gap: space.sm, marginTop: space.md },
  link: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.blue },
  backupCode: {
    fontFamily: fonts.tillBold,
    fontSize: 24,
    letterSpacing: 2,
    color: colors.ink,
    textAlign: 'center',
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: space.md,
  },
  note: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
  danger: { marginTop: space.xl, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: colors.rule, gap: space.md },
  warning: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21, color: colors.redDeep },
  error: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.red },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
  textLink: { minHeight: 44, justifyContent: 'center' },
  textLinkLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.blue, textDecorationLine: 'underline' },
  dangerText: { color: colors.red },
  feedback: { marginTop: space.lg, alignItems: 'center' },
  disabled: { opacity: 0.45 },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.rule },
});
