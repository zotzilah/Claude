import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categories } from '@/data/sample-catalogue';
import { BigButton } from '@/components/big-button';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

/**
 * Kid Mode home: picture tiles and one big button. Leaving needs the parent PIN.
 * Voice search arrives with the first development build.
 */
export default function KidHome() {
  const insets = useSafeAreaInsets();
  const list = useWishlist();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.lg }]}
    >
      <View style={styles.top}>
        <Text style={styles.hello} accessibilityRole="header">
          Hi {list.settings.circlerName}!{'\n'}What do you want?
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Grown-ups: leave Kid Mode"
          style={styles.grownups}
          onPress={() => router.push('/pin')}
        >
          <Text style={styles.grownupsText}>🔒 Grown-ups</Text>
        </Pressable>
      </View>

      <View style={styles.tiles}>
        {categories.map((c, i) => (
          <Pressable
            key={c.key}
            accessibilityRole="button"
            accessibilityLabel={c.kidLabel}
            style={({ pressed }) => [styles.tile, pressed && { transform: [{ translateY: 3 }] }]}
            onPress={() => router.navigate({ pathname: '/', params: { page: String(i) } })}
          >
            <Text style={styles.tileIcon}>{c.icon}</Text>
            <Text style={styles.tileLabel}>{c.kidLabel}</Text>
          </Pressable>
        ))}
      </View>

      <BigButton label="Send to Mum & Dad" onPress={() => router.navigate('/slip')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.yellow },
  content: { paddingHorizontal: space.lg, gap: space.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  hello: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: colors.ink, flexShrink: 1 },
  grownups: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: space.md },
  grownupsText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.yellow },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: colors.paper,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 18,
    paddingVertical: space.md,
    alignItems: 'center',
    gap: space.xs,
    boxShadow: `0 4px 0 ${colors.ink}`,
  },
  tileIcon: { fontSize: 50 },
  tileLabel: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
});
