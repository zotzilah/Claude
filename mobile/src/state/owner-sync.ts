/**
 * Keeps the parent's list in step with the backend (issue #13):
 * - signs this phone in anonymously, so no account is needed
 * - saves circles, settings and found products a moment after each change
 * - fetches what the parent may know about buying (respecting surprise mode),
 *   and refreshes it live whenever a giver claims, buys or pledges
 * Without a backend it does nothing, and the app works on this phone alone.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Claim, GroupGift, ListState } from '@/domain/types';

import {
  ensureSignedIn,
  fetchCovered,
  fetchGiverView,
  fetchShareToken,
  newShareToken,
  pushOwnerList,
  remote,
  watchList,
} from './remote';

export type SyncStatus = 'off' | 'saving' | 'saved' | 'offline';

/** What the parent's phone knows about buying, from the server. */
export type RemoteBuying =
  | { mode: 'names'; claims: Record<string, Claim>; groupGifts: Record<string, GroupGift> }
  | { mode: 'covered'; covered: Set<string> }
  | { mode: 'hidden' };

/** How long to wait after a change before saving, so a run of taps is one save. */
const SAVE_DELAY_MS = 1200;

export function useOwnerSync(list: ListState, ready: boolean) {
  const enabled = ready && list.setupComplete && remote() !== null;
  const [status, setStatus] = useState<SyncStatus>('off');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [buying, setBuying] = useState<RemoteBuying | null>(null);
  const [pushedOnce, setPushedOnce] = useState(false);
  const surprise = list.settings.surpriseMode;
  const listRef = useRef(list);
  useEffect(() => {
    listRef.current = list;
  }, [list]);

  // Save a moment after circles, settings or found products change.
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(async () => {
      setStatus('saving');
      if (!(await ensureSignedIn())) {
        setStatus('offline');
        return;
      }
      const result = await pushOwnerList(listRef.current);
      setStatus(result.ok ? 'saved' : 'offline');
      if (result.ok) setPushedOnce(true);
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, list.id, list.marks, list.settings, list.customProducts]);

  const refreshBuying = useCallback(async () => {
    const listId = listRef.current.id;
    if (surprise === 'hide-all') return;
    if (surprise === 'taken-care-of') {
      const covered = await fetchCovered(listId);
      if (covered.ok) setBuying({ mode: 'covered', covered: covered.value });
      return;
    }
    const view = await fetchGiverView(listId);
    if (view.ok) setBuying({ mode: 'names', claims: view.value.claims, groupGifts: view.value.groupGifts });
  }, [surprise]);

  // Once the list is on the server: get its share link, load buying, and stay live.
  useEffect(() => {
    if (!enabled || !pushedOnce) return;
    fetchShareToken(list.id).then((r) => r.ok && setShareToken(r.value));
    refreshBuying();
    return watchList(list.id, refreshBuying);
  }, [enabled, pushedOnce, list.id, refreshBuying]);

  // "Hide everything" needs nothing from the server. Otherwise only trust data fetched for
  // the current surprise mode, so switching modes never flashes names that should be hidden.
  const shown: RemoteBuying | null =
    surprise === 'hide-all'
      ? { mode: 'hidden' }
      : buying && buying.mode === (surprise === 'off' ? 'names' : 'covered')
        ? buying
        : null;

  /** Makes a new family link and retires the old one. Returns false if it couldn't. */
  const renewShareLink = useCallback(async () => {
    const result = await newShareToken(listRef.current.id);
    if (result.ok) setShareToken(result.value);
    return result.ok;
  }, []);

  return {
    enabled,
    status: enabled ? status : ('off' as const),
    shareToken,
    buying: enabled ? shown : null,
    renewShareLink,
  };
}
