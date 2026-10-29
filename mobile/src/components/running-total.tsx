import { StyleSheet, Text, View } from 'react-native';

import type { BudgetStatus } from '@/domain/wishlist';
import { useStrings } from '@/state/locale';
import { colors, fonts, space } from '@/theme/tokens';

interface Props {
  budget: BudgetStatus;
  count: number;
  /** Writes an amount in the list's currency. */
  money: (minor: number) => string;
  /** Circled items in another currency, left out of the total. */
  uncounted?: number;
}

export function RunningTotal({ budget, count, money, uncounted = 0 }: Props) {
  const t = useStrings();
  const { over, totalMinor, budgetMinor, remainingMinor, progress } = budget;
  return (
    <View style={[styles.bar, over && styles.over]}>
      <View style={styles.row}>
        <Text style={styles.label}>{t.runningTotal.label(count)}</Text>
        <Text style={styles.amount}>{money(totalMinor)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, over && styles.fillOver, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.msg}>
        {over
          ? t.runningTotal.over(money(-remainingMinor), money(budgetMinor))
          : t.runningTotal.left(money(remainingMinor), money(budgetMinor))}
      </Text>
      {uncounted > 0 && <Text style={styles.msg}>{t.runningTotal.otherCurrency(uncounted)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.blue, paddingHorizontal: space.lg, paddingTop: 10, paddingBottom: 14 },
  over: { backgroundColor: colors.red },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2, color: colors.paper, opacity: 0.85 },
  amount: { fontFamily: fonts.display, fontSize: 24, color: colors.paper, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 4, marginTop: 6, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.yellow },
  fillOver: { backgroundColor: colors.paper },
  msg: { fontFamily: fonts.body, fontSize: 13, color: colors.paper, marginTop: 5 },
});
