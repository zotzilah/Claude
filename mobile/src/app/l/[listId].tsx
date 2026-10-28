import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatMoney } from '@/domain/wishlist';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

/**
 * The Giver web link (no app download needed), e.g. /l/ellie-xmas-26.
 * Read-only for now and backed by local state; claims, surprise mode and
 * group gifts arrive with the backend in weeks 3–4.
 */
export default function GiverList() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const insets = useSafeAreaInsets();
  const list = useWishlist();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + space.lg }}>
      <View style={[styles.head, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.title} accessibilityRole="header">
          {list.settings.title.replace('Book', 'List')}
        </Text>
        <Text style={styles.sub}>List {listId} · no app needed</Text>
      </View>
      <View style={styles.summary}>
        <Stat value={String(list.wishes.length)} label="wishes" />
        <Stat value={formatMoney(list.budget.totalMinor)} label="list total" />
      </View>
      <View style={styles.items}>
        {list.wishes.length === 0 && <Text style={styles.empty}>No wishes circled yet.</Text>}
        {list.wishes.map(({ product, stars }) => (
          <View key={product.id} style={styles.item}>
            <Text style={styles.thumb}>{product.emoji}</Text>
            <View style={styles.itemBody}>
              <View style={styles.itemTop}>
                <Text style={styles.itemTitle}>{product.title}</Text>
                <Text style={styles.price}>{formatMoney(product.priceMinor, product.currency)}</Text>
              </View>
              <Text style={styles.meta}>
                <Text style={styles.stars}>{'★'.repeat(stars)}</Text> {product.catalogueNo} · {product.retailer}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
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
  summary: { flexDirection: 'row', gap: space.sm, margin: space.md },
  stat: { flex: 1, backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: 1, borderColor: colors.rule, padding: 10 },
  statValue: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  items: { gap: 10, marginHorizontal: space.md },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, textAlign: 'center', padding: space.lg },
  item: { flexDirection: 'row', gap: 10, backgroundColor: colors.paper, borderRadius: 12, borderWidth: 1, borderColor: colors.rule, padding: 10 },
  thumb: { width: 58, height: 58, fontSize: 34, textAlign: 'center', lineHeight: 58, borderWidth: 1, borderColor: colors.rule, borderRadius: 8 },
  itemBody: { flex: 1, gap: 4 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  itemTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, flexShrink: 1 },
  price: { fontFamily: fonts.display, fontSize: 15, color: colors.red },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft },
  stars: { fontFamily: fonts.hand, fontSize: 18, color: colors.biro },
});
