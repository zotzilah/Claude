import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius } from '@/theme/tokens';

interface Props {
  label: string;
  onPress: () => void;
  tone?: 'red' | 'yellow';
  /** Fill the remaining width in a row. */
  grow?: boolean;
}

/** A chunky, kid-sized button with a hard drop shadow that presses down. */
export function BigButton({ label, onPress, tone = 'red', grow = false }: Props) {
  const yellow = tone === 'yellow';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.big, yellow && styles.yellow, grow && styles.grow, pressed && styles.pressed]}
    >
      <Text style={[styles.text, yellow && styles.yellowText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  big: {
    backgroundColor: colors.red,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 0 ${colors.redDeep}`,
  },
  yellow: { backgroundColor: colors.yellow, boxShadow: `0 4px 0 ${colors.yellowDeep}` },
  grow: { flex: 1 },
  pressed: { transform: [{ translateY: 2 }] },
  text: { fontFamily: fonts.display, fontSize: 18, color: colors.paper, textAlign: 'center' },
  yellowText: { color: colors.ink, fontSize: 15 },
});
