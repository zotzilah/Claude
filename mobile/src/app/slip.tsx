import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { playSfx } from '@/audio/sfx';
import { BigButton } from '@/components/big-button';
import { moneyInputText } from '@/domain/money';
import { deviceLocale, useStrings } from '@/state/locale';
import { useWishlist } from '@/state/wishlist-store';
import { useThemedStyles } from '@/theme/theme-context';
import type { ThemeParts } from '@/theme/themes';
import { space } from '@/theme/tokens';

/** Matches the printer chatter in the till sound. */
const PRINT_MS = 2400;
const PRINT_STEPS = 16;

const printed = () => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * The order slip: the till rings and the slip prints out in jerky steps, like a
 * receipt printer. The emailed copy to the account holder arrives in week 5.
 */
export default function OrderSlip() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const t = useStrings();
  const reducedMotion = useReducedMotion();
  const [paperHeight, setPaperHeight] = useState(0);
  const [printRun, setPrintRun] = useState(0);
  const offset = useSharedValue(-10000);
  // Younger children see what they circled, not what it costs.
  const hidePrices = list.hidePrices;

  useEffect(() => {
    if (!paperHeight) return;
    playSfx('till');
    if (reducedMotion) {
      offset.set(0);
      printed();
      return;
    }
    // Start fully inside the till, then feed out exactly the paper's own length.
    offset.set(-paperHeight);
    offset.set(
      withTiming(0, { duration: PRINT_MS, easing: Easing.steps(PRINT_STEPS) }, (done) => {
        if (done) scheduleOnRN(printed);
      }),
    );
  }, [paperHeight, printRun, reducedMotion, offset]);

  const paperStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));
  const onPaperLayout = (e: LayoutChangeEvent) => setPaperHeight(Math.round(e.nativeEvent.layout.height));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.till}>
        <Text style={styles.counter}>{t.slip.counter}</Text>
        <Text style={styles.lcd}>{hidePrices ? '★ ★ ★' : list.money(list.budget.totalMinor)}</Text>
      </View>
      <View style={styles.slot} />
      <View style={styles.receiptWrap}>
        <Animated.View style={[styles.paper, paperStyle]} onLayout={onPaperLayout}>
          <ScrollView contentContainerStyle={styles.receipt}>
            <Text style={styles.title}>{t.slip.title}</Text>
            <Text style={[styles.mono, styles.center]}>{list.settings.title}</Text>
            <Text style={styles.rule} aria-hidden>
              - - - - - - - - - - - - - - - -
            </Text>
            {list.wishes.length === 0 && <Text style={[styles.mono, styles.center]}>{t.slip.nothing}</Text>}
            {list.wishes.map(({ product, stars }) => (
              <View key={product.id} style={styles.line}>
                <Text style={[styles.mono, styles.no]}>{product.catalogueNo || t.slip.yours}</Text>
                <Text style={[styles.mono, styles.name]}>
                  {product.title} <Text style={styles.stars}>{'★'.repeat(stars)}</Text>
                </Text>
                {!hidePrices && (
                  <Text style={styles.mono}>
                    {product.currency === list.settings.currency
                      ? moneyInputText(product.priceMinor, product.currency, deviceLocale.tag)
                      : list.money(product.priceMinor, product.currency)}
                  </Text>
                )}
              </View>
            ))}
            <Text style={styles.rule} aria-hidden>
              - - - - - - - - - - - - - - - -
            </Text>
            <View style={styles.line}>
              <Text style={[styles.mono, styles.bold]}>{t.slip.items(list.wishes.length)}</Text>
              {!hidePrices && <Text style={[styles.mono, styles.bold]}>{list.money(list.budget.totalMinor)}</Text>}
            </View>
            <View style={styles.queue}>
              <Text style={[styles.mono, styles.center]}>{t.slip.yourNumber}</Text>
              <Text style={styles.queueNo}>47</Text>
              <Text style={[styles.mono, styles.center]}>{t.templates.waitFor[list.settings.template]}</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
      <View style={styles.actions}>
        <BigButton label={t.common.back} tone="yellow" onPress={() => router.back()} />
        <BigButton label={t.slip.printAgain} onPress={() => setPrintRun((n) => n + 1)} grow />
      </View>
    </View>
  );
}

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
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
    slot: { height: 8, marginHorizontal: space.sm, marginTop: -space.md, backgroundColor: '#000', borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
    receiptWrap: { flex: 1, marginHorizontal: space.lg, marginTop: -space.md, overflow: 'hidden' },
    paper: { maxHeight: '100%' },
    actions: { flexDirection: 'row', gap: space.sm },
    receipt: { backgroundColor: colors.slip, padding: 14, gap: 4 },
    title: { fontFamily: fonts.display, fontSize: 18, color: colors.red, textAlign: 'center', letterSpacing: 1 },
    mono: { fontFamily: fonts.till, fontSize: 13.5, color: '#222' },
    bold: { fontFamily: fonts.tillBold, fontSize: 15 },
    center: { textAlign: 'center' },
    rule: { fontFamily: fonts.till, color: colors.inkSoft, textAlign: 'center' },
    line: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
    no: { width: 74 },
    name: { flex: 1 },
    stars: { fontFamily: fonts.hand, fontSize: 16, color: colors.biro },
    queue: { borderWidth: 3, borderColor: colors.ink, padding: space.sm, marginTop: space.sm },
    queueNo: { fontFamily: fonts.display, fontSize: 40, color: colors.red, textAlign: 'center' },
  });
