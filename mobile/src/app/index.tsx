import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setSoundEnabled, useSoundEnabled } from '@/audio/sfx';
import { BigButton } from '@/components/big-button';
import { PageTurner, type PageTurnerHandle } from '@/components/page-turner';
import { ProductCard } from '@/components/product-card';
import { RunningTotal } from '@/components/running-total';
import { pricesCheckedOn } from '@/data/catalogue';
import { deviceLocale, useStrings } from '@/state/locale';
import { hasPin } from '@/state/parent-pin';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

/** The catalogue: one category spread per page. */
export default function CatalogueScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ page?: string }>();
  // The page lives in the URL (?page=N), so Kid Mode tiles and shared links can open any page.
  const list = useWishlist();
  const t = useStrings();
  const pages = list.pages;
  const page = clampPage(Number(params.page ?? 0), pages.length);
  const setPage = (n: number) => router.setParams({ page: String(n) });
  const category = pages[page];
  const kid = list.kidMode;
  const soundOn = useSoundEnabled();
  const turner = useRef<PageTurnerHandle>(null);

  if (!list.list.setupComplete) return <Redirect href="/setup" />;

  const renderPage = (index: number) => {
    const onPage = list.productsFor(pages[index].key);
    return (
      <ScrollView key={index} style={styles.page} contentContainerStyle={styles.grid}>
        {onPage.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            stars={list.starsFor(p.id)}
            onTap={list.tap}
            kid={kid}
            listSide={list.listSideFor(p.id)}
            hidePrice={list.hidePrices}
          />
        ))}
        {/* Keeps a lone last product at half width instead of stretching across the page. */}
        {onPage.length % 2 === 1 && <View style={styles.spacer} />}
        <Text style={styles.hint}>
          {kid ? t.catalogue.hintKid : t.catalogue.hint}
        </Text>
        {!kid && <Text style={styles.hint}>{t.catalogue.pricesAsOf(checkedDate)}</Text>}
      </ScrollView>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.head, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.bookRow}>
          <Text style={styles.book}>{list.settings.title.toUpperCase()}</Text>
          <View style={styles.headActions}>
            {kid && <Text style={styles.kidChip}>{t.catalogue.kidModeChip}</Text>}
            <Pressable
              onPress={() => router.navigate('/catalogue-index')}
              accessibilityRole="button"
              accessibilityLabel={t.catalogue.indexA11y}
              hitSlop={10}
              style={styles.azButton}
            >
              <Text style={styles.azText}>A–Z</Text>
            </Pressable>
            <Pressable onPress={() => router.navigate('/search')} accessibilityRole="button" accessibilityLabel={t.common.search} hitSlop={10}>
              <Text style={styles.sound}>🔍</Text>
            </Pressable>
            <Pressable
              onPress={() => setSoundEnabled(!soundOn)}
              accessibilityRole="switch"
              accessibilityLabel={t.catalogue.soundA11y}
              accessibilityState={{ checked: soundOn }}
              aria-checked={soundOn}
              hitSlop={10}
            >
              <Text style={styles.sound}>{soundOn ? '🔊' : '🔇'}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.pageTitle} accessibilityRole="header">
          {category.title}
        </Text>
        <Text style={styles.pageNo}>{t.catalogue.page(category.familyCode)}</Text>
      </View>

      <PageTurner
        ref={turner}
        page={page}
        pageCount={pages.length}
        renderPage={renderPage}
        onChangePage={setPage}
      />

      <View style={styles.pager}>
        <PagerButton label="◀" a11y={t.catalogue.previousPage} disabled={page === 0} onPress={() => turner.current?.turn(-1)} />
        <View style={styles.dots}>
          {pages.map((c, i) => (
            <View key={c.key} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>
        <PagerButton
          label="▶"
          a11y={t.catalogue.nextPage}
          disabled={page === pages.length - 1}
          onPress={() => turner.current?.turn(1)}
        />
      </View>

      <View style={{ paddingBottom: insets.bottom, backgroundColor: kid ? colors.paper : colors.blue }}>
        {kid ? (
          <View style={styles.sendBar}>
            <BigButton label={t.catalogue.pictures} tone="yellow" onPress={() => router.navigate('/kid')} />
            <BigButton label={t.common.sendToParents} onPress={() => router.navigate('/slip')} grow />
          </View>
        ) : (
          <>
            {list.settings.runningTotalOn && (
              <RunningTotal budget={list.budget} count={list.wishes.length} money={list.money} uncounted={list.uncountedItems} />
            )}
            <View style={styles.devLinks}>
              {list.settings.circler === 'child' && (
                <DevLink
                  label={t.catalogue.handTo(list.settings.circlerName)}
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
                <DevLink label={t.catalogue.giverLink} onPress={() => router.navigate(`/l/${list.list.id}`)} />
              )}
              <DevLink label={t.catalogue.addFromLink} onPress={() => router.navigate('/add')} />
              <DevLink label={t.catalogue.settings} onPress={() => router.navigate('/setup')} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const checkedDate = new Date(`${pricesCheckedOn}T12:00:00Z`).toLocaleDateString(deviceLocale.tag, {
  day: 'numeric',
  month: 'long',
});

function clampPage(n: number, count: number) {
  return Number.isInteger(n) && n >= 0 && n < count ? n : 0;
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
  // Above the page stage, so the yellow page tab can overlap the page.
  head: { backgroundColor: colors.red, paddingHorizontal: space.lg, paddingBottom: space.md, zIndex: 2 },
  bookRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  sound: { fontSize: 18 },
  azButton: { backgroundColor: colors.yellow, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  azText: { fontFamily: fonts.display, fontSize: 12, color: colors.ink },
  book: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.4, color: colors.paper, flexShrink: 1 },
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
  spacer: { flexBasis: '47%', flexGrow: 1 },
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
