import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setSoundEnabled, useSoundEnabled } from '@/audio/sfx';
import { BigButton } from '@/components/big-button';
import { PageTurner, type PageTurnerHandle } from '@/components/page-turner';
import { ProductCard } from '@/components/product-card';
import { RunningTotal } from '@/components/running-total';
import { categories, productsIn } from '@/data/sample-catalogue';
import { hasPin } from '@/state/parent-pin';
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
  const soundOn = useSoundEnabled();
  const turner = useRef<PageTurnerHandle>(null);

  if (!list.list.setupComplete) return <Redirect href="/setup" />;

  const renderPage = (index: number) => (
    <ScrollView key={index} style={styles.page} contentContainerStyle={styles.grid}>
      {productsIn(categories[index].key).map((p) => (
        <ProductCard key={p.id} product={p} stars={list.starsFor(p.id)} onTap={list.tap} kid={kid} />
      ))}
      <Text style={styles.hint}>
        {kid
          ? 'Tap to circle it! Tap again for more stars ★'
          : 'Tap to circle · again for ★★ · ★★★ · 4th tap rubs it out · swipe to turn the page'}
      </Text>
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.head, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.bookRow}>
          <Text style={styles.book}>{list.settings.title.toUpperCase()}</Text>
          <View style={styles.headActions}>
            {kid && <Text style={styles.kidChip}>🔒 KID MODE</Text>}
            <Pressable onPress={() => router.navigate('/search')} accessibilityRole="button" accessibilityLabel="Search" hitSlop={10}>
              <Text style={styles.sound}>🔍</Text>
            </Pressable>
            <Pressable
              onPress={() => setSoundEnabled(!soundOn)}
              accessibilityRole="switch"
              accessibilityLabel="Sound effects"
              accessibilityState={{ checked: soundOn }}
              hitSlop={10}
            >
              <Text style={styles.sound}>{soundOn ? '🔊' : '🔇'}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.pageTitle} accessibilityRole="header">
          {category.title}
        </Text>
        <Text style={styles.pageNo}>PAGE {category.familyCode}</Text>
      </View>

      <PageTurner
        ref={turner}
        page={page}
        pageCount={categories.length}
        renderPage={renderPage}
        onChangePage={setPage}
      />

      <View style={styles.pager}>
        <PagerButton label="◀" a11y="Previous page" disabled={page === 0} onPress={() => turner.current?.turn(-1)} />
        <View style={styles.dots}>
          {categories.map((c, i) => (
            <View key={c.key} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>
        <PagerButton
          label="▶"
          a11y="Next page"
          disabled={page === categories.length - 1}
          onPress={() => turner.current?.turn(1)}
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
            {list.settings.runningTotalOn && <RunningTotal budget={list.budget} count={list.wishes.length} />}
            <View style={styles.devLinks}>
              {list.settings.circler === 'child' && (
                <DevLink
                  label={`Hand to ${list.settings.circlerName}`}
                  onPress={async () => {
                    // First hand-over: choose a PIN, which then switches Kid Mode on.
                    if (!(await hasPin())) {
                      router.navigate({ pathname: '/pin', params: { mode: 'create' } });
                      return;
                    }
                    list.setKidMode(true);
                    router.navigate('/kid');
                  }}
                />
              )}
              {list.features.giverLink && (
                <DevLink label="Giver link" onPress={() => router.navigate(`/l/${list.list.id}`)} />
              )}
              <DevLink label="Settings" onPress={() => router.navigate('/setup')} />
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
  bookRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  sound: { fontSize: 18 },
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
  page: { flex: 1, backgroundColor: colors.paper },
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
  devLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: space.lg, paddingHorizontal: space.lg, paddingBottom: space.sm },
  devLink: { paddingVertical: 6 },
  devLinkText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.yellow },
});
