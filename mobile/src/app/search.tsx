import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/product-card';
import { search } from '@/domain/search';
import { useStrings } from '@/state/locale';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

/** Search by name or catalogue number. Bigger and simpler in Kid Mode. */
export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const t = useStrings();
  const kid = list.kidMode;
  const [query, setQuery] = useState('');
  const products = useMemo(() => Object.values(list.products), [list.products]);
  const outcome = useMemo(() => search(query, products, list.pages), [query, products, list.pages]);

  const close = () => (router.canGoBack() ? router.back() : router.replace(kid ? '/kid' : '/'));

  return (
    <View style={styles.screen}>
      <View style={[styles.head, kid && styles.headKid, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t.common.backA11y} hitSlop={10} style={styles.back}>
          <Text style={[styles.backText, kid && styles.backTextKid]}>◀</Text>
        </Pressable>
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder={kid ? t.search.placeholderKid : t.search.placeholder}
          placeholderTextColor={colors.inkSoft}
          returnKeyType="search"
          autoCorrect={false}
          style={[styles.input, kid && styles.inputKid]}
          accessibilityLabel={t.common.search}
        />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xl }]} keyboardShouldPersistTaps="handled">
        {outcome.kind === 'empty' && (
          <>
            <Text style={[styles.message, kid && styles.messageKid]}>{kid ? t.search.tryThese : t.search.popular}</Text>
            <View style={styles.chips}>
              {t.search.suggestions.map((s) => (
                <Pressable key={s} onPress={() => setQuery(s)} accessibilityRole="button" style={[styles.chip, kid && styles.chipKid]}>
                  <Text style={[styles.chipText, kid && styles.chipTextKid]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {outcome.kind === 'catalogue-number' &&
          (outcome.product ? (
            <>
              <Text style={styles.message}>{t.search.catalogueNumber(outcome.catalogueNo)}</Text>
              <View style={styles.grid}>
                <ProductCard
                  product={outcome.product}
                  stars={list.starsFor(outcome.product.id)}
                  onTap={list.tap}
                  kid={kid}
                  listSide={list.listSideFor(outcome.product.id)}
                  hidePrice={list.hidePrices}
                />
                <View style={styles.gridSpacer} />
              </View>
            </>
          ) : (
            <Text style={styles.message}>{t.search.noCatalogueNumber(outcome.catalogueNo)}</Text>
          ))}

        {outcome.kind === 'results' &&
          (outcome.results.length ? (
            <>
              <Text style={styles.message} accessibilityLiveRegion="polite">
                {t.search.found(outcome.results.length)}
              </Text>
              <View style={styles.grid}>
                {outcome.results.map(({ product }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    stars={list.starsFor(product.id)}
                    onTap={list.tap}
                    kid={kid}
                    listSide={list.listSideFor(product.id)}
                    hidePrice={list.hidePrices}
                  />
                ))}
                {outcome.results.length % 2 === 1 && <View style={styles.gridSpacer} />}
              </View>
            </>
          ) : (
            <Text style={[styles.message, kid && styles.messageKid]} accessibilityLiveRegion="polite">
              {kid ? t.search.nothingKid : t.search.nothing(query.trim())}
            </Text>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.red, paddingHorizontal: space.md, paddingBottom: space.md },
  headKid: { backgroundColor: colors.yellow },
  back: { padding: space.xs },
  backText: { fontSize: 22, color: colors.paper },
  backTextKid: { color: colors.ink, fontSize: 28 },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    color: colors.ink,
  },
  inputKid: { fontFamily: fonts.display, fontSize: 22, paddingVertical: space.md, borderWidth: 3, borderColor: colors.ink, borderRadius: radius.lg },
  body: { padding: 14, gap: space.md },
  message: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.inkSoft },
  messageKid: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderWidth: 2, borderColor: colors.ink, borderRadius: radius.pill, paddingVertical: space.sm, paddingHorizontal: space.lg },
  chipKid: { backgroundColor: colors.yellow, paddingVertical: space.md },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  chipTextKid: { fontFamily: fonts.display, fontSize: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingTop: space.sm },
  gridSpacer: { flexBasis: '47%', flexGrow: 1 },
});
