import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { nextVisitIn } from '@/domain/festive';

const FLIGHT_MS = 7_000;
const WIDTH = 240;
const HEIGHT = 80;

/**
 * Santa and his sleigh crossing the area it sits in, now and then (Christmas theme).
 * Taps go through, screen readers skip it, and with Reduce Motion he stays home.
 */
export function SantaFlyby({ top = 0 }: { top?: number }) {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const flight = useSharedValue(-1);

  useEffect(() => {
    if (reducedMotion || width === 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (first: boolean) => {
      timer = setTimeout(() => {
        flight.set(0);
        flight.set(withTiming(1, { duration: FLIGHT_MS, easing: Easing.inOut(Easing.quad) }));
        schedule(false);
      }, nextVisitIn(first));
    };
    schedule(true);
    return () => {
      clearTimeout(timer);
      cancelAnimation(flight);
    };
  }, [flight, reducedMotion, width]);

  const style = useAnimatedStyle(() => {
    const p = flight.get();
    if (p < 0 || p >= 1) return { opacity: 0, transform: [{ translateX: -WIDTH }] };
    return {
      opacity: 1,
      transform: [
        { translateX: -WIDTH + p * (width + WIDTH * 2) },
        // A gentle swoop: down a little, then up and away.
        { translateY: Math.sin(p * Math.PI) * 18 - p * 26 },
        { rotate: `${-4 - p * 6}deg` },
      ],
    };
  });

  if (reducedMotion) return null;
  return (
    <View
      style={[styles.sky, { top }]}
      pointerEvents="none"
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.sleigh, style]}>
        <SantaAndSleigh />
      </Animated.View>
    </View>
  );
}

/** Two reindeer pulling Santa in his sleigh, with a present on board. */
export function SantaAndSleigh() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 240 80">
      <Path d="M86 40 q40 -8 82 4" stroke="#e8d9a8" strokeWidth={1.4} fill="none" />
      <Reindeer x={0} nose="#ff3b3b" />
      <Reindeer x={56} />
      <Path d="M156 42 q8 26 46 22 l8 -8 l-5 0 q-6 7 -30 4 q-14 -3 -16 -18 z" fill="#c81d25" />
      <Path d="M156 42 h40 l-4 16 h-30 z" fill="#c81d25" />
      <Path d="M150 60 q30 10 66 0" stroke="#f2c94c" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Rect x={164} y={26} width={22} height={18} rx={5} fill="#d1232a" />
      <Circle cx={175} cy={20} r={7} fill="#ffd9b8" />
      <Path d="M168 21 q7 10 14 0 q-2 8 -7 9 q-5 -1 -7 -9z" fill="#ffffff" />
      <Path d="M167 16 q8 -14 18 -2 z" fill="#d1232a" />
      <Circle cx={187} cy={11} r={3} fill="#ffffff" />
      <Rect x={186} y={30} width={12} height={12} rx={2} fill="#2f8f5b" />
      <Path d="M192 30 v12 M186 36 h12" stroke="#f2c94c" strokeWidth={2} />
    </Svg>
  );
}

function Reindeer({ x, nose }: { x: number; nose?: string }) {
  return (
    <G transform={`translate(${x} 0)`}>
      <Ellipse cx={40} cy={44} rx={18} ry={8} fill="#8a5a2b" />
      <Path d="M56 40 l9 -9 l4 4 l-7 9 z" fill="#8a5a2b" />
      {nose && <Circle cx={68} cy={34} r={3} fill={nose} />}
      <Path d="M28 48 l-4 12 M34 50 l-2 12 M48 50 l2 12 M54 48 l4 11" stroke="#8a5a2b" strokeWidth={3} strokeLinecap="round" />
      <Path d="M62 30 l-3 -9 M62 30 l6 -8 M59 23 l-5 -3" stroke="#d6b47a" strokeWidth={2.2} fill="none" strokeLinecap="round" />
    </G>
  );
}

const styles = StyleSheet.create({
  // Behind the header's text, in front of its background.
  sky: { position: 'absolute', left: 0, right: 0, height: HEIGHT + 40, overflow: 'visible', zIndex: -1 },
  sleigh: { position: 'absolute', left: 0, top: 20, width: WIDTH, height: HEIGHT },
});
