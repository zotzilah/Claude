import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import type { Product, Stars } from '@/domain/types';
import { formatMoney } from '@/domain/wishlist';
import { colors, fonts, space } from '@/theme/tokens';

import { BiroRing } from './biro-ring';
import { PriceSticker } from './price-sticker';

interface Props {
  product: Product;
  stars: Stars | null;
  onTap: (productId: string) => void;
  /** Kid Mode hides the retailer name. */
  kid?: boolean;
}

const STAR_WORDS = { 1: 'would like', 2: 'really want', 3: 'the big one' } as const;

export function ProductCard({ product, stars, onTap, kid = false }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };
  const press = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(stars === null ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    }
    onTap(product.id);
  };

  return (
    <Pressable
      onPress={press}
      onLayout={onLayout}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${formatMoney(product.priceMinor, product.currency)}, catalogue number ${product.catalogueNo}`}
      accessibilityState={{ selected: stars !== null }}
      accessibilityHint={stars === null ? 'Circles this item' : `Circled, ${STAR_WORDS[stars]}. Tap to change.`}
    >
      <View style={styles.photo}>
        <Text style={styles.emoji}>{product.emoji}</Text>
      </View>
      <Text style={styles.cno}>{product.catalogueNo}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {product.title}
      </Text>
      {!kid && <Text style={styles.retailer}>{product.retailer}</Text>}
      <View style={styles.sticker}>
        <PriceSticker priceMinor={product.priceMinor} />
      </View>
      {stars !== null && (
        <>
          <BiroRing width={size.width} height={size.height} seedKey={product.id} />
          <Text style={styles.stars}>{'★'.repeat(stars)}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: '47%', flexGrow: 1, padding: 6, paddingBottom: space.sm },
  photo: {
    aspectRatio: 1 / 0.82,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 52 },
  cno: { fontFamily: fonts.display, fontSize: 12.5, color: colors.blue, marginTop: 6, letterSpacing: 0.4 },
  title: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 16, color: colors.ink, marginTop: 2, minHeight: 32 },
  retailer: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 1 },
  sticker: { position: 'absolute', right: 0, top: '44%' },
  stars: {
    position: 'absolute',
    left: 2,
    top: -10,
    fontFamily: fonts.hand,
    fontSize: 26,
    color: colors.biro,
    transform: [{ rotate: '-9deg' }],
  },
});
