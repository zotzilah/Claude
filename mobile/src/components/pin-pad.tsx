import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { playSfx } from '@/audio/sfx';
import { PIN_LENGTH } from '@/domain/pin';
import { useStrings } from '@/state/locale';
import { useThemedStyles } from '@/theme/theme-context';
import type { ThemeParts } from '@/theme/themes';
import { radius, space } from '@/theme/tokens';

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Bump this number to shake the dots (wrong PIN). */
  errorCount: number;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/** Four dots and a chunky keypad. Calls onChange as digits are typed. */
export function PinPad({ value, onChange, errorCount, disabled = false }: Props) {
  const styles = useThemedStyles(makeStyles);
  const t = useStrings();
  const shake = useSharedValue(0);

  useEffect(() => {
    if (!errorCount) return;
    shake.set(withSequence(...[-10, 10, -8, 8, 0].map((x) => withTiming(x, { duration: 50 }))));
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [errorCount, shake]);

  const dotsStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  const press = (key: string) => {
    if (disabled || !key) return;
    playSfx('tick');
    if (key === '⌫') onChange(value.slice(0, -1));
    else if (value.length < PIN_LENGTH) onChange(value + key);
  };

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[styles.dots, dotsStyle]}
        role="status"
        accessibilityLabel={t.pin.enteredA11y(value.length, PIN_LENGTH)}
        accessibilityLiveRegion="polite"
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
        ))}
      </Animated.View>
      <View style={styles.keys}>
        {KEYS.map((key, i) =>
          key ? (
            <Pressable
              key={i}
              onPress={() => press(key)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={key === '⌫' ? t.pin.deleteA11y : key}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed, disabled && styles.keyDisabled]}
            >
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ) : (
            <View key={i} style={styles.blank} />
          ),
        )}
      </View>
    </View>
  );
}

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', gap: space.xl },
    dots: { flexDirection: 'row', gap: space.lg },
    dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.paper },
    dotFilled: { backgroundColor: colors.yellow, borderColor: colors.yellow },
    keys: { flexDirection: 'row', flexWrap: 'wrap', width: 3 * 76 + 2 * space.md, gap: space.md },
    key: {
      width: 76,
      height: 64,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    blank: { width: 76, height: 64 },
    keyPressed: { backgroundColor: 'rgba(255,255,255,0.3)' },
    keyDisabled: { opacity: 0.4 },
    keyText: { fontFamily: fonts.display, fontSize: 26, color: colors.paper },
  });
