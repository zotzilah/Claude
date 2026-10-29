import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { GiverPage } from '@/components/giver-page';
import { giverSummary } from '@/domain/claims';
import { loadGiverName, saveGiverName } from '@/state/giver-name';
import { useWishlist } from '@/state/wishlist-store';

/**
 * The family's view of this phone's own list, e.g. /l/<list id>. It's a preview: the real
 * shared link (/g/<token>) is the same page, backed by the server, so everyone sees the
 * same live list. Without a backend, claims made here stay on this phone.
 */
export default function GiverPreview() {
  useLocalSearchParams<{ listId: string }>();
  const list = useWishlist();
  const [me, setMe] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    loadGiverName().then((name) => {
      setMe(name);
      setNameDraft(name);
    });
  }, []);

  // Keep the 48-hour countdowns fresh.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  // The Giver view shows who's buying what, so it must never be reachable from Kid Mode.
  if (list.kidMode) return <Redirect href="/kid" />;
  // Once the list is saved online, show the real shared page, so what's claimed here is
  // what the family sees too.
  if (list.shareToken) return <Redirect href={{ pathname: '/g/[token]', params: { token: list.shareToken } }} />;

  // Every action refreshes the clock too, so a fresh claim reads "48h 00m", not a stale time.
  const act = (fn: () => void) => {
    setNow(Date.now());
    fn();
  };

  return (
    <GiverPage
      settings={list.settings}
      features={list.features}
      wishes={list.wishes}
      claims={list.list.claims}
      groupGifts={list.list.groupGifts}
      summary={giverSummary(list.wishes, list.list.claims, now, list.settings.currency)}
      money={list.money}
      me={me}
      now={now}
      nameDraft={nameDraft}
      onNameDraft={setNameDraft}
      onRememberName={async () => {
        const name = nameDraft.trim();
        if (!name) return;
        await saveGiverName(name);
        setMe(name);
      }}
      actions={{
        claim: (id) => act(() => list.claim(id, me)),
        markBought: (id) => act(() => list.markBought(id, me)),
        release: (id) => act(() => list.release(id, me)),
        startGroupGift: (id) => act(() => list.startGroupGift(id, me)),
        pledge: (id, amount) => act(() => list.pledge(id, me, amount)),
      }}
      shareUrl={list.shareUrl}
      onBack={list.list.setupComplete ? () => (router.canGoBack() ? router.back() : router.replace('/')) : undefined}
    />
  );
}
