import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { colors, fonts } from '@/theme/tokens';

const WIDTH = 74;
const HEIGHT = 40;

/** Points for a 22-point starburst, as fractions of the sticker's box. */
const BURST: [number, number][] = [
  [0.5, 0], [0.61, 0.12], [0.77, 0.06], [0.8, 0.22], [0.96, 0.26], [0.89, 0.41], [1, 0.54],
  [0.87, 0.64], [0.92, 0.81], [0.75, 0.82], [0.66, 0.98], [0.52, 0.88], [0.37, 1], [0.3, 0.84],
  [0.12, 0.88], [0.14, 0.71], [0, 0.61], [0.11, 0.48], [0.03, 0.33], [0.19, 0.27], [0.21, 0.1], [0.37, 0.13],
];
const points = BURST.map(([x, y]) => `${x * WIDTH},${y * HEIGHT}`).join(' ');

/** The loud yellow starburst price sticker, e.g. £39.99. */
export function PriceSticker({ priceMinor }: { priceMinor: number }) {
  const pounds = Math.floor(priceMinor / 100);
  const pence = String(priceMinor % 100).padStart(2, '0');
  return (
    <View style={styles.wrap} accessible={false} importantForAccessibility="no-hide-descendants">
      <Svg width={WIDTH} height={HEIGHT} style={StyleSheet.absoluteFill}>
        <Polygon points={points} fill={colors.yellow} />
      </Svg>
      <Text style={styles.pounds}>
        £{pounds}
        <Text style={styles.pence}>.{pence}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: WIDTH,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  pounds: { fontFamily: fonts.display, fontSize: 15, color: colors.redDeep },
  pence: { fontSize: 10 },
});
