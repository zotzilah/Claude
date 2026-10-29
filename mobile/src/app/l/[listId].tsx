import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GiverItem } from '@/components/giver-item';
import { giverSummary } from '@/domain/claims';
import { loadGiverName, saveGiverName } from '@/state/giver-name';
import { useStrings } from '@/state/locale';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

/**
 * The Giver web link (no app download needed), e.g. /l/<list id>.
 * Claims, surprise mode and group gifts work on this device now; with the backend
 * (weeks 3–4) everyone opening the link sees the same live list.
 */
export default function GiverList() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const t = useStrings();
  const [me, setMe] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    loadGiverName().then((name) => {
      setMe(name);
      setNameDraft(name);
    });
  }, []);

  // Keep the 48-hour countdowns fresh.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  // The Giver view shows who's buying what, so it must never be reachable from Kid Mode.
  if (list.kidMode) return <Redirect href="/kid" />;

  const { settings, features } = list;
  const summary = giverSummary(list.wishes, list.list.claims, now, settings.currency);
  const listTitle = t.giver.listTitle(settings.title);

  // Every action refreshes the clock too, so a fresh claim reads "48h 00m", not a stale time.
  const act = (fn: () => void) => () => {
    setNow(Date.now());
    fn();
  };

  const rememberName = async () => {
    const name = nameDraft.trim();
    if (!name) return;
    await saveGiverName(name);
    setMe(name);
  };

  const share = () =>
    Share.share({ message: t.giver.shareMessage(listTitle, `https://biro.example/l/${listId}`) }).catch(() => undefined);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={[styles.head, { paddingTop: insets.top + space.md }]}>
          <Text style={styles.title} accessibilityRole="header">
            {listTitle}
          </Text>
          <Text style={styles.sub}>
            {t.giver.circledBy(settings.circlerName)}
          </Text>
        </View>

        {features.claiming && settings.surpriseMode !== 'off' && (
          <Text style={styles.surprise}>
            {t.giver.surpriseOn(settings.circlerName)}
          </Text>
        )}

        {features.claiming && !me && (
          <View style={styles.nameCard}>
            <Text style={styles.nameTitle}>{t.giver.hello}</Text>
            <Text style={styles.nameHint}>{t.giver.helloHint}</Text>
            <View style={styles.nameRow}>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                onSubmitEditing={rememberName}
                placeholder={t.giver.nameExample}
                placeholderTextColor={colors.inkSoft}
                autoCapitalize="words"
                maxLength={30}
                style={styles.nameInput}
                accessibilityLabel={t.giver.nameA11y}
              />
              <Pressable onPress={rememberName} accessibilityRole="button" style={styles.nameButton}>
                <Text style={styles.nameButtonText}>{t.giver.thatsMe}</Text>
              </Pressable>
            </View>
          </View>
        )}
        {features.claiming && me ? <Text style={styles.signedIn}>{t.giver.buyingAs(me)}</Text> : null}

        <View style={styles.summary}>
          <Stat value={String(summary.wishCount)} label={t.giver.wishes} />
          <Stat value={list.money(summary.totalMinor)} label={t.giver.total} />
          {features.claiming && <Stat value={list.money(summary.remainingMinor)} label={t.giver.stillToGet} />}
        </View>

        <View style={styles.items}>
          {list.wishes.length === 0 && <Text style={styles.empty}>{t.giver.empty}</Text>}
          {list.wishes.map(({ product, stars }) => (
            <GiverItem
              key={product.id}
              product={product}
              stars={stars}
              claim={list.list.claims[product.id]}
              groupGift={list.list.groupGifts[product.id]}
              me={me}
              now={now}
              claimingOn={features.claiming}
              groupGiftsOn={features.groupGifts}
              onClaim={act(() => list.claim(product.id, me))}
              onBought={act(() => list.markBought(product.id, me))}
              onRelease={act(() => list.release(product.id, me))}
              onStartGroupGift={act(() => list.startGroupGift(product.id, me))}
              onPledge={(amount) => act(() => list.pledge(product.id, me, amount))()}
            />
          ))}
        </View>
      </ScrollView>

      {features.giverLink && (
        <View style={[styles.shareBar, { paddingBottom: insets.bottom + space.md }]}>
          <Pressable onPress={share} accessibilityRole="button" style={styles.shareButton}>
            <Text style={styles.shareText}>{t.giver.share}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper2 },
  head: { backgroundColor: colors.blue, paddingHorizontal: space.lg, paddingBottom: 14 },
  title: { fontFamily: fonts.display, fontSize: 23, color: colors.paper },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.paper, opacity: 0.9, marginTop: 4 },
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
  statValue: { fontFamily: fonts.display, fontSize: 16, color: colors.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  items: { gap: 10, marginHorizontal: space.md },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, textAlign: 'center', padding: space.lg },
  shareBar: { backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.rule, paddingHorizontal: space.md, paddingTop: space.md },
  shareButton: { backgroundColor: colors.good, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  shareText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.paper },
});
