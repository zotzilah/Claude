import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { NightSky } from '@/components/festive/night-sky';
import { SantaFlyby } from '@/components/festive/santa';
import { Snowfall } from '@/components/festive/snowfall';
import { useStrings } from '@/state/locale';
import { voiceAvailable } from '@/state/voice';
import { useWishlist } from '@/state/wishlist-store';
import { useTheme, useThemedStyles } from '@/theme/theme-context';
import type { ThemeParts } from '@/theme/themes';
import { radius, space } from '@/theme/tokens';

/**
 * Kid Mode home: search, a big "say it" mic, picture tiles and one big button.
 * Leaving needs the parent PIN. The mic shows wherever speech recognition is
 * available: web browsers today, phones once the development build adds it.
 */
export default function KidHome() {
  const styles = useThemedStyles(makeStyles);
  const { decor } = useTheme();
  const night = decor.kidBackdrop === 'night';
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const t = useStrings();

  return (
    <View style={[styles.screen, night && styles.night]}>
      {night && <NightSky />}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.lg }]}
      >
        <View style={styles.top}>
          <Text style={[styles.hello, night && styles.helloNight]} accessibilityRole="header">
            {t.kid.hello(list.settings.circlerName)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.kid.grownUpsA11y}
            style={styles.grownups}
            onPress={() => router.push('/pin')}
          >
            <Text style={styles.grownupsText}>{t.kid.grownUps}</Text>
          </Pressable>
        </View>
  
        <Pressable
          accessibilityRole="search"
          accessibilityLabel={t.kid.findA11y}
          onPress={() => router.navigate('/search')}
          style={({ pressed }) => [styles.searchBar, pressed && { transform: [{ translateY: 3 }] }]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>{t.kid.find}</Text>
        </Pressable>
        {voiceAvailable() && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.search.voiceA11y}
            onPress={() => router.navigate({ pathname: '/search', params: { voice: '1' } })}
            style={({ pressed }) => [styles.bigMic, pressed && { transform: [{ translateY: 3 }] }]}
          >
            <Text style={styles.bigMicIcon}>🎤</Text>
            <Text style={styles.bigMicText}>{t.kid.sayIt}</Text>
          </Pressable>
        )}
  
        <View style={styles.tiles}>
          {list.pages.map((c, i) => (
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
  
        <BigButton label={t.common.sendToParents} onPress={() => router.navigate('/slip')} />
      </ScrollView>
      {decor.santa && <SantaFlyby top={insets.top + 90} />}
      {decor.snow && <Snowfall count={44} seed={41} />}
    </View>
  );
}

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.yellow },
    night: { backgroundColor: '#0d2b4e' },
    scroll: { flex: 1 },
    content: { paddingHorizontal: space.lg, gap: space.lg },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
    hello: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: colors.ink, flexShrink: 1 },
    helloNight: { color: '#ffffff' },
    grownups: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: space.md },
    grownupsText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.yellow },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      backgroundColor: colors.paper,
      borderWidth: 3,
      borderColor: colors.ink,
      borderRadius: 18,
      paddingVertical: space.lg,
      paddingHorizontal: space.lg,
      boxShadow: `0 4px 0 ${colors.ink}`,
    },
    bigMic: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.md,
      backgroundColor: colors.yellow,
      borderWidth: 3,
      borderColor: colors.ink,
      borderRadius: 18,
      paddingVertical: space.lg,
      boxShadow: `0 4px 0 ${colors.ink}`,
    },
    bigMicIcon: { fontSize: 34 },
    bigMicText: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
    searchIcon: { fontSize: 28 },
    searchText: { fontFamily: fonts.display, fontSize: 22, color: colors.inkSoft },
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
