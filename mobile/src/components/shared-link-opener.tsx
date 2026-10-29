import { router, useRootNavigationState } from 'expo-router';
import { ShareIntentModule, useShareIntent } from 'expo-share-intent';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { extractUrl } from '@/domain/product-page';
import { useWishlist } from '@/state/wishlist-store';

/**
 * "Share to Biro" (issue #15): sharing a product page from a shop's app or the browser
 * opens Biro on "Add from a link" with that page ready to read. Needs a development or
 * store build; in Expo Go and on the web the share module is missing and this does nothing.
 */
export function SharedLinkOpener() {
  const list = useWishlist();
  const navigationReady = !!useRootNavigationState()?.key;
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    disabled: Platform.OS === 'web' || !ShareIntentModule,
    resetOnBackground: true,
  });

  useEffect(() => {
    if (!hasShareIntent || !navigationReady || !list.ready) return;
    const link = shareIntent.webUrl ?? extractUrl(shareIntent.text ?? '');
    resetShareIntent();
    // Children can't add things in Kid Mode, and a new phone sets up its list first.
    if (!link || list.kidMode || !list.list.setupComplete) return;
    router.push({ pathname: '/add', params: { link } });
  }, [hasShareIntent, shareIntent, navigationReady, list.ready, list.kidMode, list.list.setupComplete, resetShareIntent]);

  return null;
}
