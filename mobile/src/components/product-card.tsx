import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { playSfx } from '@/audio/sfx';
import type { ListSideView } from '@/domain/claims';
import { formatMoney } from '@/domain/money';
import type { Product, Stars } from '@/domain/types';
import type { Strings } from '@/i18n';
import { deviceLocale, useStrings } from '@/state/locale';
import { useTheme, useThemedStyles } from '@/theme/theme-context';
import type { ThemeParts } from '@/theme/themes';
import { space } from '@/theme/tokens';

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

function stampFor(view: ListSideView | null, t: Strings): { label: string; claimed: boolean } | null {
  if (!view) return null;
  if (view.kind === 'covered') return { label: t.product.takenCareOf, claimed: false };
  if (view.kind === 'bought') return { label: t.product.boughtBy(view.by), claimed: false };
  return { label: t.product.claimedBy(view.by), claimed: true };
}

export function ProductCard({ product, stars, onTap, kid = false, listSide = null, hidePrice = false }: Props) {
  const styles = useThemedStyles(makeStyles);
  const rows = useTheme().style.products === 'rows';
  const t = useStrings();
  const stamp = stampFor(listSide, t);
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Only a circle drawn by a tap on this card animates; circles shown on page load just appear.
  const [justCircled, setJustCircled] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };
  const press = () => {
    if (rows) {
      playSfx('tick');
    } else if (stars === null) {
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

  const a11yLabel = hidePrice
    ? product.title
    : t.product.a11yLabel(product.title, formatMoney(product.priceMinor, product.currency, deviceLocale.tag), product.catalogueNo);

  // The wedding look: a calm row with a photo, the name in serif, and a gold heart for favourites.
  if (rows) {
    return (
      <Pressable
        onPress={press}
        style={[styles.row, stars !== null && styles.rowLoved]}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ selected: stars !== null }}
        accessibilityValue={stamp ? { text: stamp.label } : undefined}
        accessibilityHint={stars === null ? t.product.hintFavourite : t.product.hintUnfavourite}
      >
        <View style={styles.rowPhoto}>
          {product.imageUrl ? (
            <Image source={product.imageUrl} style={styles.image} contentFit="cover" accessibilityIgnoresInvertColors />
          ) : (
            <Text style={styles.rowEmoji}>{product.emoji}</Text>
          )}
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={styles.retailer}>{product.retailer}</Text>
          <View style={styles.rowMeta}>
            <Text style={styles.rowPrice}>{formatMoney(product.priceMinor, product.currency, deviceLocale.tag)}</Text>
            {stamp && <Text style={styles.rowStamp}>{stamp.label}</Text>}
          </View>
        </View>
        <Text style={[styles.heart, stars !== null && styles.heartOn]}>{stars === null ? '♡' : '♥'}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={press}
      onLayout={onLayout}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: stars !== null }}
      accessibilityValue={stamp ? { text: stamp.label } : undefined}
      accessibilityHint={stars === null ? t.product.hintUncircled : t.product.hintCircled(stars)}
    >
      <View style={styles.photo}>
        {product.imageUrl ? (
          <Image source={product.imageUrl} style={styles.image} contentFit="contain" accessibilityIgnoresInvertColors />
        ) : (
          <Text style={styles.emoji}>{product.emoji}</Text>
        )}
        {stamp && <Text style={[styles.covered, stamp.claimed && styles.claimedStamp]}>{stamp.label}</Text>}
      </View>
      <Text style={styles.cno}>{product.catalogueNo || t.product.yourFind}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {product.title}
      </Text>
      {!kid && <Text style={styles.retailer}>{product.retailer}</Text>}
      {!hidePrice && (
        <View style={styles.sticker}>
          <PriceSticker priceMinor={product.priceMinor} currency={product.currency} />
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

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
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
    row: {
      flexBasis: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.rule,
      borderRadius: 14,
      padding: 10,
    },
    rowLoved: { borderColor: colors.biro },
    rowPhoto: {
      width: 76,
      height: 76,
      borderRadius: 10,
      backgroundColor: colors.yellow,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    rowEmoji: { fontSize: 34 },
    rowText: { flex: 1, minWidth: 0, gap: 2 },
    rowTitle: { fontFamily: fonts.display, fontSize: 19, lineHeight: 21, color: colors.ink },
    rowMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm, marginTop: 2 },
    rowPrice: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
    rowStamp: {
      fontFamily: fonts.bodyBold,
      fontSize: 11,
      letterSpacing: 1,
      color: colors.good,
      backgroundColor: '#eaf1e8',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
      overflow: 'hidden',
    },
    heart: { fontSize: 26, color: colors.biro, paddingHorizontal: 6, minWidth: 44, textAlign: 'center' },
    heartOn: { color: colors.biro },
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
