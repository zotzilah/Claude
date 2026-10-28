import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black/400Regular';
import { ArchivoNarrow_400Regular } from '@expo-google-fonts/archivo-narrow/400Regular';
import { ArchivoNarrow_600SemiBold } from '@expo-google-fonts/archivo-narrow/600SemiBold';
import { ArchivoNarrow_700Bold } from '@expo-google-fonts/archivo-narrow/700Bold';
import { CourierPrime_400Regular } from '@expo-google-fonts/courier-prime/400Regular';
import { CourierPrime_700Bold } from '@expo-google-fonts/courier-prime/700Bold';
import { GochiHand_400Regular } from '@expo-google-fonts/gochi-hand/400Regular';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { WishlistProvider } from '@/state/wishlist-store';
import { colors } from '@/theme/tokens';

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
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hide();
  }, [loaded, error]);

  // If fonts fail, carry on with system fonts rather than leaving a blank screen.
  if (!loaded && !error) return null;

  return (
    <WishlistProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
    </WishlistProvider>
  );
}
