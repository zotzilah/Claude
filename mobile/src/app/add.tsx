import { randomUUID } from 'expo-crypto';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { yourFinds } from '@/data/sample-catalogue';
import { extractUrl, type ProductDetails } from '@/domain/product-page';
import { parseMoneyInput } from '@/domain/settings';
import { detailsFromUrl, fetchProduct } from '@/state/fetch-product';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

type Status = 'idle' | 'loading' | 'found' | 'manual';

const FAILURE: Record<'timeout' | 'blocked' | 'not-found', string> = {
  timeout: 'That shop took too long to answer. Fill in the details below.',
  blocked: "We couldn't read that page (some shops block it). Fill in the details below.",
  'not-found': "That page doesn't seem to exist. Check the link, or fill in the details below.",
};

/**
 * Paste a link from any shop (brief §8.2). Biro reads the name, price and photo,
 * the parent checks them, and the item goes on this list only.
 */
export default function AddFromLink() {
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const [link, setLink] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [title, setTitle] = useState('');
  const [priceText, setPriceText] = useState('');
  const [retailer, setRetailer] = useState('');
  const [tried, setTried] = useState(false);

  if (list.kidMode) return <Redirect href="/kid" />;

  const fill = (d: ProductDetails) => {
    setDetails(d);
    setTitle(d.title ?? '');
    setPriceText(d.priceMinor !== null ? (d.priceMinor / 100).toFixed(2) : '');
    setRetailer(d.retailer);
  };

  const lookUp = async () => {
    const url = extractUrl(link);
    if (!url) {
      setMessage("That doesn't look like a shop link. It should start with https://");
      return;
    }
    setStatus('loading');
    setMessage(null);
    const result = await fetchProduct(url);
    if (result.ok && (result.details.title || result.details.priceMinor !== null)) {
      fill(result.details);
      setStatus('found');
      const missing = [!result.details.title && 'name', result.details.priceMinor === null && 'price'].filter(Boolean);
      setMessage(missing.length ? `Found it, but add the ${missing.join(' and ')}.` : 'Found it! Check the details.');
    } else {
      fill(detailsFromUrl(url));
      setStatus('manual');
      setMessage(FAILURE[result.ok ? 'blocked' : result.reason]);
    }
  };

  const priceMinor = parseMoneyInput(priceText);
  const problem = !title.trim() ? 'Add a name' : priceMinor === null || priceMinor <= 0 ? 'Add a price, e.g. 24.99' : null;

  const add = () => {
    setTried(true);
    if (problem || !details || priceMinor === null) return;
    list.addCustomProduct({
      id: `custom-${randomUUID()}`,
      catalogueNo: '',
      title: title.trim(),
      categoryKey: yourFinds.key,
      priceMinor,
      currency: details.currency ?? list.settings.currency,
      retailer: retailer.trim() || details.retailer,
      url: details.url,
      emoji: '🎁',
      ...(details.imageUrl ? { imageUrl: details.imageUrl } : {}),
    });
    // "Your Finds" is always the last page once there's something on it.
    router.dismissTo({ pathname: '/', params: { page: String(list.pages.length - (list.pages.at(-1)?.key === yourFinds.key ? 1 : 0)) } });
  };

  const showForm = status === 'found' || status === 'manual';

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.head, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.kicker}>ADD FROM ANY SHOP</Text>
        <Text style={styles.heading} accessibilityRole="header">
          Paste a link
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.help}>
          {`Found something ${list.settings.circlerName || 'they'} would love? Copy the link from the shop's app or website and paste it here.`}
        </Text>
        <TextInput
          value={link}
          onChangeText={(text) => {
            setLink(text);
            setStatus('idle');
            setMessage(null);
          }}
          onSubmitEditing={lookUp}
          placeholder="https://"
          placeholderTextColor={colors.inkSoft}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          style={styles.input}
          accessibilityLabel="Shop link"
        />
        {status !== 'loading' && !showForm && <BigButton label="Find it" onPress={lookUp} />}
        {status === 'loading' && (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.blue} />
            <Text style={styles.help}>{"Looking at the shop's page…"}</Text>
          </View>
        )}
        {message && (
          <Text style={[styles.message, status === 'found' && styles.messageGood]} accessibilityLiveRegion="polite">
            {message}
          </Text>
        )}

        {showForm && (
          <View style={styles.form}>
            {details?.imageUrl && (
              <Image source={details.imageUrl} style={styles.image} contentFit="contain" accessibilityLabel="Product photo" />
            )}
            <Text style={styles.label}>Name</Text>
            <TextInput value={title} onChangeText={setTitle} style={styles.input} maxLength={120} accessibilityLabel="Name" />
            <Text style={styles.label}>Price</Text>
            <View style={styles.moneyRow}>
              <Text style={styles.currency}>{details?.currency && details.currency !== 'GBP' ? details.currency : '£'}</Text>
              <TextInput
                value={priceText}
                onChangeText={setPriceText}
                keyboardType="decimal-pad"
                placeholder="24.99"
                placeholderTextColor={colors.inkSoft}
                style={[styles.input, styles.moneyInput]}
                accessibilityLabel="Price"
              />
            </View>
            <Text style={styles.label}>Shop</Text>
            <TextInput value={retailer} onChangeText={setRetailer} style={styles.input} maxLength={60} accessibilityLabel="Shop" />
            <Text style={styles.note}>
              Only your list sees this. Givers tap through to the shop to buy it.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        {tried && problem && <Text style={styles.problem}>{problem}</Text>}
        <View style={styles.row}>
          <BigButton label="Cancel" tone="yellow" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          {showForm && <BigButton label="Circle it! ⭕" onPress={add} grow />}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper2 },
  head: { backgroundColor: colors.red, paddingHorizontal: space.lg, paddingBottom: space.lg },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.4, color: colors.paper, opacity: 0.9 },
  heading: { fontFamily: fonts.display, fontSize: 28, color: colors.paper, marginTop: 4 },
  body: { padding: space.lg, gap: space.md },
  help: { fontFamily: fonts.body, fontSize: 15, lineHeight: 20, color: colors.inkSoft },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
    minWidth: 0,
  },
  loading: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  message: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.redDeep },
  messageGood: { color: colors.good },
  form: { gap: space.sm },
  image: { height: 180, backgroundColor: colors.paper, borderRadius: radius.md },
  label: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginTop: space.sm },
  moneyRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  currency: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  moneyInput: { flex: 1 },
  note: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: space.sm },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.sm, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.rule },
  problem: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.red, textAlign: 'center' },
  row: { flexDirection: 'row', gap: space.sm },
});
