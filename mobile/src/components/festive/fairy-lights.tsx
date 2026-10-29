import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const BULB_COLOURS = ['#ff5a5a', '#f2c94c', '#5ad18a', '#6fb7ff'];
const SPACING = 32;
const HEIGHT = 24;

/** The wire sags between hooks; bulbs hang from it. */
const sag = (x: number) => 9 + Math.abs(Math.sin(x / 31)) * 7;

/**
 * A string of fairy lights along the bottom of a header (Christmas theme). The bulbs
 * twinkle in turn; with Reduce Motion they stay lit and still.
 */
export function FairyLights() {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const phase = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    phase.set(withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(phase);
  }, [phase, reducedMotion]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const bulbs = width > 0 ? Array.from({ length: Math.floor((width - 16) / SPACING) + 1 }, (_, i) => 16 + i * SPACING) : [];
  const wire = width > 0 ? `M0 6 ${Array.from({ length: Math.ceil(width / 8) + 1 }, (_, i) => `L${i * 8} ${sag(i * 8) - 4}`).join(' ')}` : '';

  return (
    <View style={styles.strip} pointerEvents="none" onLayout={onLayout} aria-hidden importantForAccessibility="no-hide-descendants">
      {width > 0 && (
        <Svg width={width} height={HEIGHT} style={StyleSheet.absoluteFill}>
          <Path d={wire} stroke="#2c2c2c" strokeWidth={1.5} fill="none" />
        </Svg>
      )}
      {bulbs.map((x, i) => (
        <Bulb key={x} x={x} colour={BULB_COLOURS[i % BULB_COLOURS.length]} offset={i / bulbs.length} phase={phase} still={reducedMotion} />
      ))}
    </View>
  );
}

function Bulb({ x, colour, offset, phase, still }: { x: number; colour: string; offset: number; phase: SharedValue<number>; still: boolean }) {
  const style = useAnimatedStyle(() => ({
    opacity: still ? 1 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin((phase.get() + offset) * Math.PI * 2)),
  }));
  return <Animated.View style={[styles.bulb, { left: x - 4.5, top: sag(x) - 3, backgroundColor: colour, boxShadow: `0 0 6px ${colour}` }, style]} />;
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, right: 0, bottom: -6, height: HEIGHT },
  bulb: { position: 'absolute', width: 9, height: 11, borderRadius: 5 },
});
