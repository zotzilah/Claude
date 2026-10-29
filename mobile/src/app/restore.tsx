import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { SERVER_ERROR_TEXT } from '@/domain/remote-rows';
import { saveBackupCode } from '@/state/backup-code';
import { useStrings } from '@/state/locale';
import { restoreWithBackupCode } from '@/state/remote';
import { useWishlist } from '@/state/wishlist-store';
import { useTheme, useThemedStyles } from '@/theme/theme-context';
import type { ThemeParts } from '@/theme/themes';
import { radius, space } from '@/theme/tokens';

/**
 * A new phone brings back a list with the backup code made on the old one
 * (Settings → Account). Reached from the first step of setup.
 */
export default function Restore() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const t = useStrings();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/setup'));

  const restore = async () => {
    if (busy || code.replace(/[^a-z0-9]/gi, '').length < 16) {
      setError(SERVER_ERROR_TEXT['bad-backup-code']);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await restoreWithBackupCode(code);
    setBusy(false);
    if (!result.ok) {
      setError(SERVER_ERROR_TEXT[result.error === 'offline' ? 'unknown' : result.error]);
      return;
    }
    // The code still works, so keep it where Settings → Account can show it.
    await saveBackupCode(result.value.id, code.trim().toUpperCase());
    list.replaceList(result.value);
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.head, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.kicker}>{t.restore.kicker}</Text>
        <Text style={styles.heading} accessibilityRole="header">
          {t.restore.heading}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.help}>{t.restore.help}</Text>
        <Text style={styles.label} nativeID="code-label">
          {t.restore.label}
        </Text>
        <TextInput
          value={code}
          onChangeText={(text) => {
            setCode(text);
            setError(null);
          }}
          onSubmitEditing={restore}
          placeholder={t.restore.example}
          placeholderTextColor={colors.inkSoft}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={30}
          returnKeyType="go"
          style={styles.input}
          accessibilityLabelledBy="code-label"
        />
        <BigButton label={busy ? t.restore.working : t.restore.go} onPress={restore} />
        <Text style={styles.note}>{t.restore.note}</Text>
        {error && (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {error}
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <BigButton label={t.common.back} tone="yellow" onPress={close} />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
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
      fontFamily: fonts.tillBold,
      fontSize: 20,
      letterSpacing: 2,
      color: colors.ink,
      minWidth: 0,
    },
    note: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
    error: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.red },
    footer: { paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.rule },
  });
