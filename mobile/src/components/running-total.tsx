import { StyleSheet, Text, View } from 'react-native';

import type { BudgetStatus } from '@/domain/wishlist';
import { formatMoney } from '@/domain/wishlist';
import { colors, fonts, space } from '@/theme/tokens';

export function RunningTotal({ budget, count }: { budget: BudgetStatus; count: number }) {
  const { over, totalMinor, budgetMinor, remainingMinor, progress } = budget;
  return (
    <View style={[styles.bar, over && styles.over]} accessibilityRole="summary">
      <View style={styles.row}>
        <Text style={styles.label}>RUNNING TOTAL · {count} CIRCLED</Text>
        <Text style={styles.amount}>{formatMoney(totalMinor)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, over && styles.fillOver, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.msg}>
        {over
          ? `${formatMoney(-remainingMinor)} over the ${formatMoney(budgetMinor)} budget`
          : `${formatMoney(remainingMinor)} left in the ${formatMoney(budgetMinor)} budget`}
      </Text>
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
