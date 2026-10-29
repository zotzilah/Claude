import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '@/theme/tokens';

interface Props {
  label: string;
  icon?: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** Smaller pill style, e.g. for age bands. */
  compact?: boolean;
}

/** A big tappable option, catalogue style: chunky border, yellow when chosen. */
export function ChoiceCard({ label, icon, description, selected, onPress, compact = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      // The web build needs aria-checked spelled out for screen readers to say "selected".
      aria-checked={selected}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={({ pressed }) => [
        compact ? styles.pill : styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {icon && <Text style={compact ? styles.pillIcon : styles.icon}>{icon}</Text>}
      <View style={styles.text}>
        <Text style={compact ? styles.pillLabel : styles.label}>{label}</Text>
        {description && !compact && <Text style={styles.description}>{description}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.paper,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    padding: space.md,
    boxShadow: `0 4px 0 ${colors.ink}`,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  selected: { backgroundColor: colors.yellow },
  pressed: { transform: [{ translateY: 2 }] },
  icon: { fontSize: 34 },
  pillIcon: { fontSize: 18 },
  text: { flexShrink: 1 },
  label: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  pillLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  description: { fontFamily: fonts.body, fontSize: 14, lineHeight: 18, color: colors.inkSoft, marginTop: 2 },
});
