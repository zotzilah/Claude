import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { GiverPage } from '@/components/giver-page';
import { productsById } from '@/data/catalogue';
import { giverSummary } from '@/domain/claims';
import { formatMoney } from '@/domain/money';
import { SERVER_ERROR_TEXT, type ServerError } from '@/domain/remote-rows';
import { featuresFor } from '@/domain/settings';
import type { ListState } from '@/domain/types';
import { sortedWishes } from '@/domain/wishlist';
import { loadGiverName, saveGiverName } from '@/state/giver-name';
import { deviceLocale, useStrings } from '@/state/locale';
import * as server from '@/state/remote';
import { useWishlist } from '@/state/wishlist-store';
import { ThemeProvider, useTheme, useThemedStyles } from '@/theme/theme-context';
import { themeFor, type ThemeParts } from '@/theme/themes';
import { space } from '@/theme/tokens';

type Shared = Pick<ListState, 'settings' | 'marks' | 'customProducts' | 'claims' | 'groupGifts'>;

const errorText = (error: ServerError | 'unknown' | 'offline') =>
  error === 'offline' ? SERVER_ERROR_TEXT.unknown : SERVER_ERROR_TEXT[error];

/**
 * The shared link the family opens, e.g. https://…/app/g/<share token>. No app or account:
 * they say who they are, and the server gives them an anonymous session and the live list.
 * Everything they do goes through the database's checked functions.
 */
export default function SharedList() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();
  const t = useStrings();
  const local = useWishlist();
  const [me, setMe] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [listId, setListId] = useState<string | null>(null);
  const [view, setView] = useState<Shared | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async (id: string) => {
    const result = await server.fetchGiverView(id);
    setNow(Date.now());
    if (result.ok) setView(result.value);
    else setError(errorText(result.error));
  }, []);

  const join = useCallback(
    async (name: string) => {
      setLoading(true);
      setError(null);
      const joined = await server.joinList(token, name);
      if (!joined.ok) {
        setError(errorText(joined.error));
        setLoading(false);
        return;
      }
      setListId(joined.value);
      await refresh(joined.value);
      setLoading(false);
    },
    [token, refresh],
  );

  // A returning giver is remembered on this phone, so they go straight in.
  useEffect(() => {
    loadGiverName().then((name) => {
      setNameDraft(name);
      if (name) {
        setMe(name);
        join(name);
      } else {
        setLoading(false);
      }
    });
  }, [join]);

  // Live: claims by anyone else appear straight away.
  useEffect(() => (listId ? server.watchList(listId, () => refresh(listId)) : undefined), [listId, refresh]);

  // Keep the 48-hour countdowns fresh.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const products = useMemo(() => ({ ...productsById, ...(view?.customProducts ?? {}) }), [view]);
  const wishes = useMemo(() => (view ? sortedWishes(view.marks, products) : []), [view, products]);

  // A child in Kid Mode never sees who's buying, even by opening a link.
  if (local.kidMode) return <Redirect href="/kid" />;

  // The phone that made this list gets a way back to its catalogue.
  const onBack = local.shareToken === token ? () => (router.canGoBack() ? router.back() : router.replace('/')) : undefined;

  const act = (call: (id: string) => Promise<server.Result<void>>) => async () => {
    if (!listId) return;
    setError(null);
    const result = await call(listId);
    if (!result.ok) setError(errorText(result.error));
    await refresh(listId);
  };

  if (!view && loading) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={colors.blue} />
        <Text style={styles.waitingText}>{t.giver.opening}</Text>
      </View>
    );
  }

  if (!view) {
    return (
      <GiverPage
        settings={{
          ...local.settings,
          title: t.giver.sharedListTitle,
          circlerName: '',
          surpriseMode: 'off',
        }}
        features={{ claiming: true, groupGifts: false, giverLink: false }}
        wishes={[]}
        claims={{}}
        groupGifts={{}}
        summary={{ wishCount: 0, totalMinor: 0, remainingMinor: 0 }}
        money={(m) => formatMoney(m, local.settings.currency, deviceLocale.tag)}
        me=""
        now={now}
        nameDraft={nameDraft}
        onNameDraft={setNameDraft}
        onRememberName={async () => {
          const name = nameDraft.trim();
          if (!name) return;
          await saveGiverName(name);
          setMe(name);
          join(name);
        }}
        actions={{
          claim: () => undefined,
          markBought: () => undefined,
          release: () => undefined,
          startGroupGift: () => undefined,
          pledge: () => undefined,
        }}
        shareUrl={null}
        error={error}
        hideSummary
        onBack={onBack}
      />
    );
  }

  const features = featuresFor(view.settings.buyers);
  const currency = view.settings.currency;

  return (
    // The family see the list in its occasion's look, whatever their own phone's list is.
    <ThemeProvider theme={themeFor(view.settings.template)}>
      <GiverPage
        settings={view.settings}
        features={features}
        wishes={wishes}
        claims={view.claims}
        groupGifts={view.groupGifts}
        summary={giverSummary(wishes, view.claims, now, currency)}
        money={(m) => formatMoney(m, currency, deviceLocale.tag)}
        me={me}
        now={now}
        nameDraft={nameDraft}
        onNameDraft={setNameDraft}
        onRememberName={async () => {
          const name = nameDraft.trim();
          if (!name) return;
          await saveGiverName(name);
          setMe(name);
          join(name);
        }}
        actions={{
          claim: (id) => act((list) => server.claimItem(list, id))(),
          markBought: (id) => act((list) => server.markBought(list, id))(),
          release: (id) => act((list) => server.releaseClaim(list, id))(),
          startGroupGift: (id) => act((list) => server.startGroupGift(list, id))(),
          pledge: (id, amount) => act((list) => server.pledge(list, id, amount))(),
        }}
        shareUrl={`${server.WEB_APP_URL}/g/${token}`}
        onBack={onBack}
        error={error}
      />
    </ThemeProvider>
  );
}

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
    waiting: {
      flex: 1,
      backgroundColor: colors.paper2,
      justifyContent: 'center',
    },
    waitingText: {
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      color: colors.inkSoft,
      textAlign: 'center',
      marginTop: space.md,
    },
  });
