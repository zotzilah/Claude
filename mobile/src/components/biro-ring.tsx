import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { hashSeed, wobblyCircle } from '@/domain/wobbly-circle';
import { colors } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How long the pen takes to go round. Matches the scribble sound. */
const DRAW_MS = 420;

interface Props {
  width: number;
  height: number;
  /** Anything stable, e.g. the product id, so the circle looks the same every time. */
  seedKey: string;
  /** Draw the circle on like a pen stroke (for a fresh tap) instead of showing it at once. */
  animate?: boolean;
}

/** A hand-drawn biro circle around its parent. */
export function BiroRing({ width, height, seedKey, animate = false }: Props) {
  const reducedMotion = useReducedMotion();
  const drawOn = animate && !reducedMotion;
  const { d, length } = useMemo(() => wobblyCircle(width, height, hashSeed(seedKey)), [width, height, seedKey]);
  const progress = useSharedValue(drawOn ? 0 : 1);

  useEffect(() => {
    if (drawOn) progress.set(withTiming(1, { duration: DRAW_MS, easing: Easing.bezier(0.3, 0.6, 0.4, 1) }));
  }, [drawOn, progress]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.get()) }));

  if (!width || !height) return null;
  return (
    <Svg width={width} height={height} style={styles.ring} pointerEvents="none">
      <AnimatedPath
        d={d}
        fill="none"
        stroke={colors.biro}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[length, length]}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', left: 0, top: 0, overflow: 'visible' },
});
