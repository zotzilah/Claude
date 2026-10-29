import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme/theme-context';
import type { ThemeParts } from '@/theme/themes';
import { radius } from '@/theme/tokens';

interface Props {
  label: string;
  onPress: () => void;
  tone?: 'red' | 'yellow';
  /** Fill the remaining width in a row. */
  grow?: boolean;
}

/**
 * A chunky, kid-sized button with a hard drop shadow that presses down. In the
 * wedding look it's a slim pill instead: solid for the main action, outlined otherwise.
 */
export function BigButton({ label, onPress, tone = 'red', grow = false }: Props) {
  const styles = useThemedStyles(makeStyles);
  const pill = useTheme().style.buttons === 'pill';
  const yellow = tone === 'yellow';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.big,
        yellow && styles.yellow,
        pill && styles.pill,
        pill && yellow && styles.pillOutline,
        grow && styles.grow,
        pressed && (pill ? styles.pillPressed : styles.pressed),
      ]}
    >
      <Text style={[styles.text, yellow && styles.yellowText, pill && styles.pillText, pill && yellow && styles.pillOutlineText]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
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
    pill: { borderRadius: 999, boxShadow: 'none', paddingVertical: 13 },
    pillOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.ink },
    pillPressed: { opacity: 0.75 },
    pillText: { fontFamily: fonts.bodySemi, fontSize: 16 },
    pillOutlineText: { color: colors.ink },
  });
