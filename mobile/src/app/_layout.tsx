import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black/400Regular';
import { ArchivoNarrow_400Regular } from '@expo-google-fonts/archivo-narrow/400Regular';
import { ArchivoNarrow_600SemiBold } from '@expo-google-fonts/archivo-narrow/600SemiBold';
import { ArchivoNarrow_700Bold } from '@expo-google-fonts/archivo-narrow/700Bold';
import { CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond/500Medium_Italic';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { CourierPrime_400Regular } from '@expo-google-fonts/courier-prime/400Regular';
import { CourierPrime_700Bold } from '@expo-google-fonts/courier-prime/700Bold';
import { GochiHand_400Regular } from '@expo-google-fonts/gochi-hand/400Regular';
import { Jost_400Regular } from '@expo-google-fonts/jost/400Regular';
import { Jost_500Medium } from '@expo-google-fonts/jost/500Medium';
import { Jost_600SemiBold } from '@expo-google-fonts/jost/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { preloadSfx } from '@/audio/sfx';
import { SharedLinkOpener } from '@/components/shared-link-opener';
import { pushAllowed, showPushesInApp, turnOnPushes } from '@/state/push';
import { useWishlist, WishlistProvider } from '@/state/wishlist-store';
import { ThemeProvider, useTheme, useThemedStyles } from '@/theme/theme-context';
import { themeFor, type ThemeParts } from '@/theme/themes';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ArchivoBlack_400Regular,
    ArchivoNarrow_400Regular,
    ArchivoNarrow_600SemiBold,
    ArchivoNarrow_700Bold,
    GochiHand_400Regular,
    CourierPrime_400Regular,
    CourierPrime_700Bold,
    // Weddings and anniversaries.
    CormorantGaramond_600SemiBold,
    CormorantGaramond_500Medium_Italic,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hide();
  }, [loaded, error]);

  useEffect(() => {
    preloadSfx();
    // Pushes show while Biro is open too, and a phone that allowed them re-registers each
    // launch, since push tokens can change.
    showPushesInApp();
    pushAllowed().then((allowed) => {
      if (allowed) turnOnPushes();
    });
  }, []);

  // If fonts fail, carry on with system fonts rather than leaving a blank screen.
  if (!loaded && !error) return null;

  return (
    <WishlistProvider>
      <ListTheme>
        <Desk />
      </ListTheme>
    </WishlistProvider>
  );
}

/** The list's occasion decides how everything looks (Christmas, classic…). */
function ListTheme({ children }: { children: ReactNode }) {
  const list = useWishlist();
  return <ThemeProvider theme={themeFor(list.settings.template)}>{children}</ThemeProvider>;
}

function Desk() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    // role="main" gives screen readers on the web a landmark to jump to.
    <GestureHandlerRootView style={styles.desk} role="main">
      {/* On a computer, the app sits in a phone-width column like an open catalogue on a desk. */}
      <View style={styles.page}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
        <SharedLinkOpener />
      </View>
    </GestureHandlerRootView>
  );
}

/** Widest the app gets on a computer screen: a large phone. */
const MAX_WIDTH = 480;

const makeStyles = ({ colors }: ThemeParts) =>
  StyleSheet.create({
    desk: { flex: 1, backgroundColor: Platform.OS === 'web' ? colors.blue : colors.paper, alignItems: 'center' },
    page: {
      flex: 1,
      width: '100%',
      maxWidth: Platform.OS === 'web' ? MAX_WIDTH : undefined,
      overflow: 'hidden',
      ...(Platform.OS === 'web' ? { boxShadow: '0 0 40px rgba(0, 0, 0, 0.35)' } : {}),
    },
  });
