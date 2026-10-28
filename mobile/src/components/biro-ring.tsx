import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { hashSeed, wobblyCircle } from '@/domain/wobbly-circle';
import { colors } from '@/theme/tokens';

interface Props {
  width: number;
  height: number;
  /** Anything stable, e.g. the product id, so the circle looks the same every time. */
  seedKey: string;
}

/**
 * A hand-drawn biro circle around its parent.
 * Static for now; the draw-on animation and scribble sound arrive with task 2.
 */
export function BiroRing({ width, height, seedKey }: Props) {
  if (!width || !height) return null;
  const { d } = wobblyCircle(width, height, hashSeed(seedKey));
  return (
    <Svg width={width} height={height} style={styles.ring} pointerEvents="none">
      <Path d={d} fill="none" stroke={colors.biro} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', left: 0, top: 0, overflow: 'visible' },
});
