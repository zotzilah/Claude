import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { playSfx } from '@/audio/sfx';
import type { ListSideView } from '@/domain/claims';
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
  /** What the list side may know about who's buying this (respects surprise mode). */
  listSide?: ListSideView | null;
  /** Kid Mode for younger children: no price sticker. */
  hidePrice?: boolean;
}

function stampFor(view: ListSideView | null): { label: string; claimed: boolean } | null {
  if (!view) return null;
  if (view.kind === 'covered') return { label: 'TAKEN CARE OF ✓', claimed: false };
  if (view.kind === 'bought') return { label: `BOUGHT ✓ ${view.by.toUpperCase()}`, claimed: false };
  return { label: `CLAIMED · ${view.by.toUpperCase()}`, claimed: true };
}

const STAR_WORDS = { 1: 'would like', 2: 'really want', 3: 'the big one' } as const;

export function ProductCard({ product, stars, onTap, kid = false, listSide = null, hidePrice = false }: Props) {
  const stamp = stampFor(listSide);
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Only a circle drawn by a tap on this card animates; circles shown on page load just appear.
  const [justCircled, setJustCircled] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };
  const press = () => {
    if (stars === null) {
      playSfx('scribble');
      setJustCircled(true);
    } else {
      playSfx(stars === 3 ? 'rub' : 'tick');
    }
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
      accessibilityLabel={
        hidePrice
          ? product.title
          : `${product.title}, ${formatMoney(product.priceMinor, product.currency)}, catalogue number ${product.catalogueNo}`
      }
      accessibilityState={{ selected: stars !== null }}
      accessibilityValue={stamp ? { text: stamp.label } : undefined}
      accessibilityHint={stars === null ? 'Circles this item' : `Circled, ${STAR_WORDS[stars]}. Tap to change.`}
    >
      <View style={styles.photo}>
        {product.imageUrl ? (
          <Image source={product.imageUrl} style={styles.image} contentFit="contain" accessibilityIgnoresInvertColors />
        ) : (
          <Text style={styles.emoji}>{product.emoji}</Text>
        )}
        {stamp && <Text style={[styles.covered, stamp.claimed && styles.claimedStamp]}>{stamp.label}</Text>}
      </View>
      <Text style={styles.cno}>{product.catalogueNo || 'YOUR FIND'}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {product.title}
      </Text>
      {!kid && <Text style={styles.retailer}>{product.retailer}</Text>}
      {!hidePrice && (
        <View style={styles.sticker}>
          <PriceSticker priceMinor={product.priceMinor} />
        </View>
      )}
      {stars !== null && (
        <>
          <BiroRing width={size.width} height={size.height} seedKey={product.id} animate={justCircled} />
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
  image: { width: '90%', height: '90%' },
  covered: {
    position: 'absolute',
    top: 8,
    left: 6,
    transform: [{ rotate: '-6deg' }],
    borderWidth: 2,
    borderColor: colors.good,
    color: colors.good,
    backgroundColor: 'rgba(255,255,255,0.85)',
    fontFamily: fonts.display,
    fontSize: 10,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    maxWidth: '92%',
  },
  claimedStamp: { borderColor: '#b07d00', color: '#8a6200' },
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
