import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { ProductCard } from '@/components/product-card';
import { RunningTotal } from '@/components/running-total';
import { categories, productsIn } from '@/data/sample-catalogue';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

/** The catalogue: one category spread per page. */
export default function CatalogueScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ page?: string }>();
  // The page lives in the URL (?page=N), so Kid Mode tiles and shared links can open any page.
  const page = clampPage(Number(params.page ?? 0));
  const setPage = (n: number) => router.setParams({ page: String(n) });
  const list = useWishlist();
  const category = categories[page];
  const kid = list.kidMode;

  return (
    <View style={styles.screen}>
      <View style={[styles.head, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.bookRow}>
          <Text style={styles.book}>{list.title.toUpperCase()}</Text>
          {kid && <Text style={styles.kidChip}>🔒 KID MODE</Text>}
        </View>
        <Text style={styles.pageTitle} accessibilityRole="header">
          {category.title}
        </Text>
        <Text style={styles.pageNo}>PAGE {category.familyCode}</Text>
      </View>

      <ScrollView style={styles.page} contentContainerStyle={styles.grid}>
        {productsIn(category.key).map((p) => (
          <ProductCard key={p.id} product={p} stars={list.starsFor(p.id)} onTap={list.tap} kid={kid} />
        ))}
        <Text style={styles.hint}>
          {kid ? 'Tap to circle it! Tap again for more stars ★' : 'Tap to circle · again for ★★ · ★★★ · 4th tap rubs it out'}
        </Text>
      </ScrollView>

      <View style={styles.pager}>
        <PagerButton label="◀" a11y="Previous page" disabled={page === 0} onPress={() => setPage(page - 1)} />
        <View style={styles.dots}>
          {categories.map((c, i) => (
            <View key={c.key} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>
        <PagerButton
          label="▶"
          a11y="Next page"
          disabled={page === categories.length - 1}
          onPress={() => setPage(page + 1)}
        />
      </View>

      <View style={{ paddingBottom: insets.bottom, backgroundColor: kid ? colors.paper : colors.blue }}>
        {kid ? (
          <View style={styles.sendBar}>
            <BigButton label="◀ Pictures" tone="yellow" onPress={() => router.navigate('/kid')} />
            <BigButton label="Send to Mum & Dad" onPress={() => router.navigate('/slip')} grow />
          </View>
        ) : (
          <>
            {list.runningTotalOn && <RunningTotal budget={list.budget} count={list.wishes.length} />}
            <View style={styles.devLinks}>
              <DevLink label="Hand to Ellie (Kid Mode)" onPress={() => { list.setKidMode(true); router.navigate('/kid'); }} />
              <DevLink label="Giver link" onPress={() => router.navigate('/l/ellie-xmas-26')} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function clampPage(n: number) {
  return Number.isInteger(n) && n >= 0 && n < categories.length ? n : 0;
}

function PagerButton(props: { label: string; a11y: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityLabel={props.a11y}
      style={[styles.pagerBtn, props.disabled && styles.pagerBtnOff]}
    >
      <Text style={styles.pagerBtnText}>{props.label}</Text>
    </Pressable>
  );
}

function DevLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={styles.devLink}>
      <Text style={styles.devLinkText}>{label} ▸</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  head: { backgroundColor: colors.red, paddingHorizontal: space.lg, paddingBottom: space.md },
  bookRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  book: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.4, color: colors.paper, opacity: 0.9, flexShrink: 1 },
  kidChip: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.yellow, backgroundColor: colors.ink, paddingHorizontal: 6, borderRadius: radius.sm, overflow: 'hidden' },
  pageTitle: { fontFamily: fonts.display, fontSize: 27, color: colors.paper, marginTop: 6 },
  pageNo: {
    position: 'absolute',
    right: 0,
    bottom: -14,
    zIndex: 3,
    backgroundColor: colors.yellow,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 13,
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 10,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    overflow: 'hidden',
  },
  page: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 14, paddingTop: 24, paddingBottom: space.lg },
  hint: { width: '100%', textAlign: 'center', fontFamily: fonts.hand, fontSize: 17, color: colors.biro },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  pagerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  pagerBtnOff: { opacity: 0.3 },
  pagerBtnText: { color: colors.paper, fontSize: 18, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.rule },
  dotOn: { backgroundColor: colors.red },
  sendBar: { flexDirection: 'row', gap: space.sm, padding: 14, borderTopWidth: 1, borderTopColor: colors.rule },
  devLinks: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: space.sm },
  devLink: { paddingVertical: 6 },
  devLinkText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.yellow },
});
