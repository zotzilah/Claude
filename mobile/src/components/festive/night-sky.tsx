import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const STARS: [number, number, number][] = [
  [0.1, 0.05, 1.4],
  [0.3, 0.09, 1],
  [0.54, 0.04, 1.6],
  [0.67, 0.14, 1],
  [0.2, 0.16, 1.2],
  [0.95, 0.19, 1.3],
  [0.44, 0.22, 1],
];

/** Kid Mode's Christmas backdrop: a starry night with a moon, and snow lying on the ground. */
export function NightSky() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={['#0d2b4e', '#123d63', '#1b5079']} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        {STARS.map(([x, y, r]) => (
          <Circle key={`${x}-${y}`} cx={x * 100} cy={y * 100} r={r * 0.25} fill="#ffffff" opacity={0.8} />
        ))}
      </Svg>
      <View style={styles.moon} />
      <View style={styles.moonShadow} />
      <Svg width="100%" height={70} viewBox="0 0 390 70" preserveAspectRatio="none" style={styles.ground}>
        <Path d="M0 24 Q90 -6 190 18 T390 4 V70 H0Z" fill="#f4f8ff" />
        <Path d="M0 46 Q120 26 240 44 T390 34 V70 H0Z" fill="#ffffff" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  moon: { position: 'absolute', right: 34, top: 58, width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff6d8', opacity: 0.92 },
  // A second disc in the sky's colour turns the moon into a crescent.
  moonShadow: { position: 'absolute', right: 24, top: 50, width: 58, height: 58, borderRadius: 29, backgroundColor: '#0e2d51' },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
