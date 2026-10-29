import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FairyLights } from '@/components/festive/fairy-lights';
import { Snowfall } from '@/components/festive/snowfall';
import { GiverItem } from '@/components/giver-item';
import { whatsAppShareUrl } from '@/domain/notifications';
import { isGrownUpOccasion, type Features } from '@/domain/settings';
import type { Claim, GroupGift, ListSettings, Product, Stars } from '@/domain/types';
import { sendFeedback } from '@/state/feedback';
import { useStrings } from '@/state/locale';
import { useTheme, useThemedStyles } from '@/theme/theme-context';
import type { ThemeParts } from '@/theme/themes';
import { radius, space } from '@/theme/tokens';

export interface GiverActions {
  claim: (productId: string) => void;
  markBought: (productId: string) => void;
  release: (productId: string) => void;
  startGroupGift: (productId: string) => void;
  pledge: (productId: string, amountMinor: number) => void;
}

interface Props {
  settings: ListSettings;
  features: Features;
  wishes: { product: Product; stars: Stars }[];
  claims: Record<string, Claim>;
  groupGifts: Record<string, GroupGift>;
  summary: { wishCount: number; totalMinor: number; remainingMinor: number };
  money: (minor: number) => string;
  /** Who's using this device; empty until they've said. */
  me: string;
  now: number;
  nameDraft: string;
  onNameDraft: (text: string) => void;
  onRememberName: () => void;
  actions: GiverActions;
  /** The link to pass on to more family, or null when there isn't one yet. */
  shareUrl: string | null;
  /** Shown on the phone that made the list, where this page is a preview. */
  onBack?: () => void;
  /** Something went wrong talking to the server, in words the reader understands. */
  error?: string | null;
  /** Before a giver has joined there's nothing to count yet. */
  hideSummary?: boolean;
}

/**
 * The page the family sees: the wishes, who's getting what, and the buttons to
 * claim, buy and chip in. Used for the preview on the parent's phone and for the
 * real shared link.
 */
export function GiverPage(props: Props) {
  const styles = useThemedStyles(makeStyles);
  const { colors, decor } = useTheme();
  const { settings, features, me } = props;
  const insets = useSafeAreaInsets();
  const t = useStrings();
  const listTitle = t.giver.listTitle(settings.title);
  const grownUp = isGrownUpOccasion(settings.template);

  const shareMessage = props.shareUrl ? t.giver.shareMessage(listTitle, props.shareUrl) : null;
  const share = () => shareMessage && Share.share({ message: shareMessage }).catch(() => undefined);
  const shareOnWhatsApp = () => shareMessage && Linking.openURL(whatsAppShareUrl(shareMessage)).catch(() => undefined);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={[styles.head, { paddingTop: insets.top + space.md }, decor.lights && styles.headLit]}>
          {props.onBack && (
            <Pressable onPress={props.onBack} accessibilityRole="button" hitSlop={10} style={styles.back}>
              <Text style={styles.backText}>{t.giver.backToCatalogue}</Text>
            </Pressable>
          )}
          <Text style={styles.title} accessibilityRole="header">
            {listTitle}
          </Text>
          <Text style={styles.sub}>{grownUp ? t.giver.inviteToChoose : t.giver.circledBy(settings.circlerName)}</Text>
          {decor.lights && <FairyLights />}
        </View>

        {features.claiming && settings.surpriseMode !== 'off' && (
          <Text style={styles.surprise}>{t.giver.surpriseOn(settings.circlerName)}</Text>
        )}

        {props.error && (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {props.error}
          </Text>
        )}

        {features.claiming && !me && (
          <View style={styles.nameCard}>
            <Text style={styles.nameTitle}>{t.giver.hello}</Text>
            <Text style={styles.nameHint}>{t.giver.helloHint}</Text>
            <View style={styles.nameRow}>
              <TextInput
                value={props.nameDraft}
                onChangeText={props.onNameDraft}
                onSubmitEditing={props.onRememberName}
                placeholder={t.giver.nameExample}
                placeholderTextColor={colors.inkSoft}
                autoCapitalize="words"
                maxLength={30}
                style={styles.nameInput}
                accessibilityLabel={t.giver.nameA11y}
              />
              <Pressable onPress={props.onRememberName} accessibilityRole="button" style={styles.nameButton}>
                <Text style={styles.nameButtonText}>{t.giver.thatsMe}</Text>
              </Pressable>
            </View>
          </View>
        )}
        {features.claiming && me ? <Text style={styles.signedIn}>{t.giver.buyingAs(me)}</Text> : null}

        {!props.hideSummary && (
          <View style={styles.summary}>
            <Stat value={String(props.summary.wishCount)} label={grownUp ? t.giver.gifts : t.giver.wishes} />
            <Stat value={props.money(props.summary.totalMinor)} label={t.giver.total} />
            {features.claiming && <Stat value={props.money(props.summary.remainingMinor)} label={t.giver.stillToGet} />}
          </View>
        )}

        <View style={styles.items}>
          {props.wishes.length === 0 && !props.hideSummary && <Text style={styles.empty}>{t.giver.empty}</Text>}
          {props.wishes.map(({ product, stars }) => (
            <GiverItem
              key={product.id}
              product={product}
              stars={stars}
              claim={props.claims[product.id]}
              groupGift={props.groupGifts[product.id]}
              me={me}
              now={props.now}
              claimingOn={features.claiming}
              groupGiftsOn={features.groupGifts}
              grownUp={grownUp}
              onClaim={() => props.actions.claim(product.id)}
              onBought={() => props.actions.markBought(product.id)}
              onRelease={() => props.actions.release(product.id)}
              onStartGroupGift={() => props.actions.startGroupGift(product.id)}
              onPledge={(amount) => props.actions.pledge(product.id, amount)}
            />
          ))}
        </View>
        <Pressable
          onPress={() => sendFeedback(t.feedback.subject, t.feedback.prompt, 'Family link')}
          accessibilityRole="link"
          hitSlop={8}
          style={styles.feedback}
        >
          <Text style={styles.feedbackText}>{t.feedback.link}</Text>
        </Pressable>
      </ScrollView>

      {features.giverLink && shareMessage && (
        <View style={[styles.shareBar, { paddingBottom: insets.bottom + space.md }]}>
          <Pressable onPress={shareOnWhatsApp} accessibilityRole="link" style={styles.shareButton}>
            <Text style={styles.shareText}>{t.giver.shareOnWhatsApp}</Text>
          </Pressable>
          <Pressable onPress={share} accessibilityRole="button" style={[styles.shareButton, styles.shareOther]}>
            <Text style={[styles.shareText, styles.shareOtherText]}>{t.giver.share}</Text>
          </Pressable>
        </View>
      )}
      {decor.snow && <Snowfall count={28} seed={13} />}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.paper2 },
    head: { backgroundColor: colors.blue, paddingHorizontal: space.lg, paddingBottom: 14 },
    // Room for the fairy lights under the title.
    headLit: { paddingBottom: 28 },
    back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: space.xs },
    backText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.yellow },
    title: { fontFamily: fonts.display, fontSize: 23, color: colors.paper },
    sub: { fontFamily: fonts.body, fontSize: 14, color: colors.paper, marginTop: 4 },
    surprise: {
      marginHorizontal: space.md,
      marginTop: space.md,
      backgroundColor: colors.yellow,
      borderRadius: radius.md,
      paddingVertical: space.sm,
      paddingHorizontal: space.md,
      fontFamily: fonts.bodySemi,
      fontSize: 14,
      color: colors.ink,
      overflow: 'hidden',
    },
    nameCard: {
      margin: space.md,
      marginBottom: 0,
      backgroundColor: colors.paper,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.blue,
      padding: space.md,
      gap: 6,
    },
    nameTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
    nameHint: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
    nameRow: { flexDirection: 'row', gap: space.sm, marginTop: 4 },
    nameInput: {
      flex: 1,
      minWidth: 0,
      borderWidth: 2,
      borderColor: colors.ink,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      fontFamily: fonts.bodySemi,
      fontSize: 16,
      color: colors.ink,
    },
    nameButton: { backgroundColor: colors.blue, borderRadius: radius.md, paddingHorizontal: space.lg, justifyContent: 'center' },
    nameButtonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.paper },
    signedIn: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkSoft, marginHorizontal: space.md, marginTop: space.sm },
    summary: { flexDirection: 'row', gap: space.sm, margin: space.md },
    stat: { flex: 1, backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: 1, borderColor: colors.rule, padding: 10 },
    statValue: { fontFamily: fonts.display, fontSize: 16, color: colors.ink, fontVariant: ['tabular-nums', 'lining-nums'] },
    statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
    items: { gap: 10, marginHorizontal: space.md },
    feedback: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: space.lg },
    feedbackText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.blue, textDecorationLine: 'underline' },
    empty: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, textAlign: 'center', padding: space.lg },
    shareBar: { backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.rule, paddingHorizontal: space.md, paddingTop: space.md, gap: space.sm },
    shareOther: { backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.blue },
    shareOtherText: { color: colors.blue },
    shareButton: { backgroundColor: colors.good, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
    shareText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.paper },
    error: {
      marginHorizontal: space.md,
      marginTop: space.md,
      fontFamily: fonts.bodyBold,
      fontSize: 15,
      color: colors.redDeep,
    },
  });
