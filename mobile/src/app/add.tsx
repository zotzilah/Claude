import { randomUUID } from 'expo-crypto';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { yourFinds } from '@/data/catalogue';
import { currencySymbol, moneyInputText, parseMoneyInput, toMinor } from '@/domain/money';
import { checkLink, checkProduct, findDuplicate } from '@/domain/moderation';
import { extractUrl, type ProductDetails } from '@/domain/product-page';
import { detailsFromUrl, fetchProduct } from '@/state/fetch-product';
import { deviceLocale, useStrings } from '@/state/locale';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

type Status = 'idle' | 'loading' | 'found' | 'manual';

/**
 * Paste a link from any shop (brief §8.2). Biro reads the name, price and photo,
 * the parent checks them, and the item goes on this list only.
 */
export default function AddFromLink() {
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const t = useStrings();
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
    setPriceText(d.priceMinor !== null ? moneyInputText(d.priceMinor, d.currency ?? list.settings.currency, deviceLocale.tag) : '');
    setRetailer(d.retailer);
  };

  const lookUp = async () => {
    const url = extractUrl(link);
    if (!url) {
      setMessage(t.add.notALink);
      return;
    }
    // Never even fetch from sites that can't go on a family list.
    const refused = checkLink(url);
    if (refused) {
      setMessage(t.add.refused[refused]);
      return;
    }
    const existing = findDuplicate(url, Object.values(list.products));
    if (existing) {
      setMessage(t.add.alreadyOnList(existing.title));
      return;
    }
    setStatus('loading');
    setMessage(null);
    const result = await fetchProduct(url);
    if (result.ok && (result.details.title || result.details.priceMinor !== null)) {
      fill(result.details);
      setStatus('found');
      const noName = !result.details.title;
      const noPrice = result.details.priceMinor === null;
      setMessage(noName || noPrice ? t.add.foundMissing(noName, noPrice) : t.add.found);
    } else {
      fill(detailsFromUrl(url));
      setStatus('manual');
      setMessage(t.add.failure[result.ok ? 'blocked' : result.reason]);
    }
  };

  const currency = details?.currency ?? list.settings.currency;
  const priceExample = moneyInputText(toMinor(24.99, currency), currency, deviceLocale.tag);
  const priceMinor = parseMoneyInput(priceText, currency, deviceLocale.tag);
  const problem = !title.trim()
    ? t.add.needName
    : priceMinor === null || priceMinor <= 0
      ? t.add.needPrice(priceExample)
      : null;

  const add = () => {
    setTried(true);
    if (problem || !details || priceMinor === null) return;
    const check = checkProduct(
      { url: details.url, title: title.trim(), priceMinor, currency, imageUrl: details.imageUrl },
      list.settings.circler === 'child',
    );
    if (!check.ok) {
      setMessage(t.add.refused[check.reason]);
      return;
    }
    list.addCustomProduct({
      id: `custom-${randomUUID()}`,
      catalogueNo: '',
      title: title.trim(),
      categoryKey: yourFinds.key,
      priceMinor,
      currency,
      retailer: retailer.trim() || details.retailer,
      url: details.url,
      emoji: '🎁',
      ...(details.imageUrl ? { imageUrl: details.imageUrl } : {}),
      ...(check.flags.length ? { reviewFlags: check.flags } : {}),
    });
    // "Your Finds" is always the last page once there's something on it.
    router.dismissTo({ pathname: '/', params: { page: String(list.pages.length - (list.pages.at(-1)?.key === yourFinds.key ? 1 : 0)) } });
  };

  const showForm = status === 'found' || status === 'manual';

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.head, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.kicker}>{t.add.kicker}</Text>
        <Text style={styles.heading} accessibilityRole="header">
          {t.add.heading}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.help}>
          {t.add.help(list.settings.circlerName)}
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
          accessibilityLabel={t.add.linkA11y}
        />
        {status !== 'loading' && !showForm && <BigButton label={t.add.find} onPress={lookUp} />}
        {status === 'loading' && (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.blue} />
            <Text style={styles.help}>{t.add.looking}</Text>
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
              <Image source={details.imageUrl} style={styles.image} contentFit="contain" accessibilityLabel={t.add.photoA11y} />
            )}
            <Text style={styles.label}>{t.add.name}</Text>
            <TextInput value={title} onChangeText={setTitle} style={styles.input} maxLength={120} accessibilityLabel={t.add.name} />
            <Text style={styles.label}>{t.add.price}</Text>
            <View style={styles.moneyRow}>
              <Text style={styles.currency}>{currencySymbol(currency, deviceLocale.tag)}</Text>
              <TextInput
                value={priceText}
                onChangeText={setPriceText}
                keyboardType="decimal-pad"
                placeholder={priceExample}
                placeholderTextColor={colors.inkSoft}
                style={[styles.input, styles.moneyInput]}
                accessibilityLabel={t.add.price}
              />
            </View>
            <Text style={styles.label}>{t.add.shop}</Text>
            <TextInput value={retailer} onChangeText={setRetailer} style={styles.input} maxLength={60} accessibilityLabel={t.add.shop} />
            <Text style={styles.note}>{t.add.privateNote}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        {tried && problem && <Text style={styles.problem}>{problem}</Text>}
        <View style={styles.row}>
          <BigButton label={t.common.cancel} tone="yellow" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          {showForm && <BigButton label={t.add.circleIt} onPress={add} grow />}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper2 },
  head: { backgroundColor: colors.red, paddingHorizontal: space.lg, paddingBottom: space.lg },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.4, color: colors.paper },
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
