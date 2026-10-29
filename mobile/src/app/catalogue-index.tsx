import { router } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildCatalogueIndex, type IndexEntry } from '@/domain/catalogue-index';
import { useStrings } from '@/state/locale';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

/** The A–Z index at the back of the catalogue. Tap an entry to turn to its page. */
export default function CatalogueIndex() {
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const t = useStrings();
  const sections = useMemo(
    () =>
      buildCatalogueIndex(list.pages, list.productsFor, t.catalogue.page).map((s) => ({ title: s.letter, data: s.entries })),
    [list, t],
  );
  const listRef = useRef<SectionList<IndexEntry, { title: string }>>(null);

  const open = (entry: IndexEntry) => router.navigate({ pathname: '/', params: { page: String(entry.pageIndex) } });
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.screen}>
      <View style={[styles.head, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headRow}>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t.index.backA11y} hitSlop={10}>
            <Text style={styles.back}>◀</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {t.index.title}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.letters}>
          {sections.map((s, i) => (
            <Pressable
              key={s.title}
              onPress={() => listRef.current?.scrollToLocation({ sectionIndex: i, itemIndex: 0, viewOffset: 0 })}
              accessibilityRole="button"
              accessibilityLabel={t.index.jumpTo(s.title)}
              style={styles.letter}
            >
              <Text style={styles.letterText}>{s.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(e) => `${e.kind}-${e.productId ?? e.ref}-${e.label}`}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}
        onScrollToIndexFailed={() => undefined}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHead}>{section.title}</Text>}
        renderItem={({ item }) => {
          const stars = item.productId ? list.starsFor(item.productId) : null;
          return (
            <Pressable
              onPress={() => open(item)}
              accessibilityRole="link"
              accessibilityLabel={t.index.entryA11y(item.label, item.ref, stars)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={[styles.label, item.kind === 'page' && styles.pageLabel]} numberOfLines={1}>
                {item.label}
                {stars ? <Text style={styles.stars}>{`  ${'★'.repeat(stars)}`}</Text> : null}
              </Text>
              <View style={styles.leader} />
              <Text style={[styles.ref, item.kind === 'page' && styles.pageRef]}>{item.ref}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  head: { backgroundColor: colors.red, paddingBottom: space.sm },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg },
  back: { fontSize: 22, color: colors.paper },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.paper },
  letters: { paddingHorizontal: space.md, paddingTop: space.sm, gap: 6 },
  letter: { minWidth: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  sectionHead: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.paper,
    backgroundColor: colors.blue,
    paddingHorizontal: space.lg,
    paddingVertical: 4,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: space.lg, paddingVertical: 9 },
  rowPressed: { backgroundColor: colors.paper2 },
  label: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink, flexShrink: 1 },
  pageLabel: { fontFamily: fonts.display, fontSize: 15, color: colors.red },
  stars: { fontFamily: fonts.hand, fontSize: 17, color: colors.biro },
  leader: { flex: 1, minWidth: 12, borderBottomWidth: 2, borderStyle: 'dotted', borderColor: colors.rule, marginBottom: 5 },
  ref: { fontFamily: fonts.display, fontSize: 14, color: colors.blue, fontVariant: ['tabular-nums'] },
  pageRef: { color: colors.red },
});
