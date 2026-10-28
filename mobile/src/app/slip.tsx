import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatMoney } from '@/domain/wishlist';
import { BigButton } from '@/components/big-button';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, space } from '@/theme/tokens';

/**
 * The order slip. Content only for now; the print-out animation, till sound
 * and emailed copy arrive in week 5.
 */
export default function OrderSlip() {
  const insets = useSafeAreaInsets();
  const list = useWishlist();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.till}>
        <Text style={styles.counter}>COUNTER 3</Text>
        <Text style={styles.lcd}>{formatMoney(list.budget.totalMinor)}</Text>
      </View>
      <ScrollView style={styles.receiptWrap} contentContainerStyle={styles.receipt}>
        <Text style={styles.title}>ORDER SLIP</Text>
        <Text style={[styles.mono, styles.center]}>{list.title}</Text>
        <Text style={styles.rule}>- - - - - - - - - - - - - - - -</Text>
        {list.wishes.length === 0 && <Text style={[styles.mono, styles.center]}>Nothing circled yet!</Text>}
        {list.wishes.map(({ product, stars }) => (
          <View key={product.id} style={styles.line}>
            <Text style={[styles.mono, styles.no]}>{product.catalogueNo}</Text>
            <Text style={[styles.mono, styles.name]}>
              {product.title} <Text style={styles.stars}>{'★'.repeat(stars)}</Text>
            </Text>
            <Text style={styles.mono}>{(product.priceMinor / 100).toFixed(2)}</Text>
          </View>
        ))}
        <Text style={styles.rule}>- - - - - - - - - - - - - - - -</Text>
        <View style={styles.line}>
          <Text style={[styles.mono, styles.bold]}>{list.wishes.length} ITEMS</Text>
          <Text style={[styles.mono, styles.bold]}>{formatMoney(list.budget.totalMinor)}</Text>
        </View>
        <View style={styles.queue}>
          <Text style={[styles.mono, styles.center]}>YOUR NUMBER IS</Text>
          <Text style={styles.queueNo}>47</Text>
          <Text style={[styles.mono, styles.center]}>PLEASE WAIT FOR CHRISTMAS</Text>
        </View>
      </ScrollView>
      <BigButton label="◀ Back" tone="yellow" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.blueDeep, paddingHorizontal: space.lg, gap: space.md },
  till: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#20242e',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  counter: { fontFamily: fonts.bodyBold, color: '#cfd6e6', letterSpacing: 1 },
  lcd: { fontFamily: fonts.tillBold, fontSize: 18, color: '#17310a', backgroundColor: '#9fd36b', paddingHorizontal: 10, paddingVertical: 2 },
  receiptWrap: { flex: 1, marginHorizontal: space.lg },
  receipt: { backgroundColor: colors.slip, padding: 14, gap: 4 },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.red, textAlign: 'center', letterSpacing: 1 },
  mono: { fontFamily: fonts.till, fontSize: 13.5, color: '#222' },
  bold: { fontFamily: fonts.tillBold, fontSize: 15 },
  center: { textAlign: 'center' },
  rule: { fontFamily: fonts.till, color: '#9aa0aa', textAlign: 'center' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  no: { width: 74 },
  name: { flex: 1 },
  stars: { fontFamily: fonts.hand, fontSize: 16, color: colors.biro },
  queue: { borderWidth: 3, borderColor: colors.ink, padding: space.sm, marginTop: space.sm },
  queueNo: { fontFamily: fonts.display, fontSize: 40, color: colors.red, textAlign: 'center' },
});
