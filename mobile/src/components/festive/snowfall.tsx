import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { makeFlakes, type Flake } from '@/domain/festive';

/** How many flakes fall at once. Enough to feel snowy, few enough to stay smooth on older phones. */
const FLAKES = 36;

/**
 * Snow drifting down over whatever is behind it (Christmas theme). Taps go straight
 * through, and it isn't drawn at all for people who have Reduce Motion on.
 */
export function Snowfall({ count = FLAKES, seed }: { count?: number; seed?: number }) {
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const flakes = useMemo(() => makeFlakes(count, seed), [count, seed]);
  const onLayout = (e: LayoutChangeEvent) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });

  if (reducedMotion) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout} aria-hidden importantForAccessibility="no-hide-descendants">
      {size.height > 0 && flakes.map((f, i) => <FallingFlake key={i} flake={f} width={size.width} height={size.height} />)}
    </View>
  );
}

function FallingFlake({ flake, width, height }: { flake: Flake; width: number; height: number }) {
  const progress = useSharedValue(flake.head);

  useEffect(() => {
    // Finish the first fall from wherever it starts, then fall from the top forever.
    const first = flake.durationMs * (1 - flake.head);
    progress.set(
      withSequence(
        withTiming(1, { duration: first, easing: Easing.linear }),
        withTiming(0, { duration: 0 }),
        withRepeat(withTiming(1, { duration: flake.durationMs, easing: Easing.linear }), -1, false),
      ),
    );
    return () => cancelAnimation(progress);
  }, [flake, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      transform: [{ translateY: -12 + p * (height + 24) }, { translateX: Math.sin(p * Math.PI * 2) * flake.drift * 0.5 + p * flake.drift }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.flake,
        { left: flake.x * width, width: flake.size, height: flake.size, borderRadius: flake.size / 2, opacity: flake.opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  flake: { position: 'absolute', top: 0, backgroundColor: '#ffffff', boxShadow: '0 0 3px rgba(20, 40, 80, 0.35)' },
});
