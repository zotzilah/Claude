import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { activeClaim, formatCountdown, msLeft, pledgedMinor } from '@/domain/claims';
import { amountsFor, currencySymbol, formatMoney, formatMoneyShort, parseMoneyInput } from '@/domain/money';
import { groupGiftThresholdMinor } from '@/domain/settings';
import type { Claim, GroupGift, Product, Stars } from '@/domain/types';
import { deviceLocale, useStrings } from '@/state/locale';
import { useTheme, useThemedStyles } from '@/theme/theme-context';
import type { ThemeParts } from '@/theme/themes';
import { radius, space } from '@/theme/tokens';

const money = (minor: number, currency: string) => formatMoney(minor, currency, deviceLocale.tag);

interface Props {
  product: Product;
  stars: Stars;
  claim: Claim | undefined;
  groupGift: GroupGift | undefined;
  /** Who's using this device; empty until they've said. */
  me: string;
  now: number;
  /** Off for "just me" lists: show the wishes, nothing to claim. */
  claimingOn: boolean;
  groupGiftsOn: boolean;
  /** Weddings and anniversaries: gentler wording ("I'll give this"). */
  grownUp?: boolean;
  onClaim: () => void;
  onBought: () => void;
  onRelease: () => void;
  onStartGroupGift: () => void;
  onPledge: (amountMinor: number) => void;
}

/** One wish on the Giver page: what it is, who has it, and what you can do. */
export function GiverItem(props: Props) {
  const styles = useThemedStyles(makeStyles);
  const { product, stars, me, now } = props;
  const t = useStrings();
  const claim = activeClaim(props.claim, now);
  const mine = claim?.giverName === me;
  const canGroup = props.groupGiftsOn && !claim && product.priceMinor >= groupGiftThresholdMinor(product.currency);

  return (
    <View style={[styles.item, claim?.status === 'bought' && styles.itemDone]}>
      <View style={styles.top}>
        {product.imageUrl ? (
          <Image source={product.imageUrl} style={styles.thumbImage} contentFit="contain" accessibilityIgnoresInvertColors />
        ) : (
          <Text style={styles.thumb}>{product.emoji}</Text>
        )}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.title}</Text>
            <Text style={styles.price}>{money(product.priceMinor, product.currency)}</Text>
          </View>
          <View style={styles.meta}>
            {/* Wedding lists have no star levels: every gift is simply on the list. */}
            {!props.grownUp && (
              <Text style={styles.stars} accessibilityLabel={t.common.stars(stars)}>
                {'★'.repeat(stars)}
              </Text>
            )}
            {product.catalogueNo ? <Text style={styles.metaText}>{product.catalogueNo}</Text> : null}
            <Pressable onPress={() => WebBrowser.openBrowserAsync(product.url)} accessibilityRole="link" hitSlop={6}>
              <Text style={styles.link}>{t.giver.viewAt(product.retailer || t.common.theShop)}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {props.claimingOn && props.groupGift && !claim && <GroupGiftBox {...props} gift={props.groupGift} />}

      {props.claimingOn && (
        <View style={styles.actions}>
          {!claim && (
            <>
              <ActionButton
                label={props.groupGift ? t.giver.claimToBuy : props.grownUp ? t.giver.giveThis : t.giver.claim}
                onPress={props.onClaim}
                disabled={!me}
              />
              {canGroup && !props.groupGift && (
                <ActionButton
                  label={props.grownUp ? t.giver.chipIn : t.giver.makeGroupGift}
                  ghost
                  onPress={props.onStartGroupGift}
                  disabled={!me}
                />
              )}
              {!props.groupGift && <Text style={styles.hint}>{t.giver.heldFor48}</Text>}
            </>
          )}
          {claim?.status === 'held' && mine && (
            <>
              <Text style={[styles.pill, styles.pillHeld]}>{t.giver.heldByYou(formatCountdown(msLeft(claim, now)))}</Text>
              <ActionButton label={t.giver.bought} tone="good" onPress={props.onBought} />
              <ActionButton label={t.giver.release} ghost onPress={props.onRelease} />
            </>
          )}
          {claim?.status === 'held' && !mine && (
            <Text style={[styles.pill, styles.pillHeld]}>
              {t.giver.claimedBy(claim.giverName, formatCountdown(msLeft(claim, now)))}
            </Text>
          )}
          {claim?.status === 'bought' && (
            <Text style={[styles.pill, styles.pillBought]}>{t.giver.boughtBy(mine ? t.giver.you : claim.giverName)}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function GroupGiftBox(props: Props & { gift: GroupGift }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { gift, product, me } = props;
  const t = useStrings();
  const currency = product.currency;
  const pledged = pledgedMinor(gift);
  const myPledge = gift.pledges.find((p) => p.giverName === me);
  const [other, setOther] = useState('');
  const otherMinor = parseMoneyInput(other, currency, deviceLocale.tag);

  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>
        {t.giver.groupGiftBy(gift.organiserName === me ? t.giver.you : gift.organiserName)}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, (pledged / product.priceMinor) * 100)}%` }]} />
      </View>
      <Text style={styles.groupText}>
        {t.giver.pledged(money(pledged, currency), money(product.priceMinor, currency))}
        {gift.pledges.length ? ` · ${gift.pledges.map((p) => `${p.giverName} ${money(p.amountMinor, currency)}`).join(' · ')}` : ''}
      </Text>
      {me ? (
        <>
          <View style={styles.actions}>
            {amountsFor(currency).pledgesMinor.map((amount) => (
              <ActionButton
                key={amount}
                label={`${myPledge?.amountMinor === amount ? '✓ ' : ''}${formatMoneyShort(amount, currency, deviceLocale.tag)}`}
                ghost={myPledge?.amountMinor !== amount}
                onPress={() => props.onPledge(amount)}
              />
            ))}
            <TextInput
              value={other}
              onChangeText={setOther}
              placeholder={t.giver.other(currencySymbol(currency, deviceLocale.tag))}
              placeholderTextColor={colors.inkSoft}
              keyboardType="decimal-pad"
              style={styles.otherInput}
              accessibilityLabel={t.giver.otherA11y}
            />
            {otherMinor !== null && otherMinor > 0 && (
              <ActionButton label={t.giver.pledge} onPress={() => { props.onPledge(otherMinor); setOther(''); }} />
            )}
          </View>
          {myPledge && (
            <Pressable onPress={() => props.onPledge(0)} accessibilityRole="button" hitSlop={6}>
              <Text style={styles.link}>{t.giver.removePledge}</Text>
            </Pressable>
          )}
          <Text style={styles.hint}>
            {gift.organiserName === me
              ? t.giver.organiserNote
              : t.giver.pledgerNote(gift.organiserName)}
          </Text>
        </>
      ) : null}
    </View>
  );
}

function ActionButton(props: { label: string; onPress: () => void; ghost?: boolean; tone?: 'good'; disabled?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      style={({ pressed }) => [
        styles.button,
        props.ghost && styles.buttonGhost,
        props.tone === 'good' && styles.buttonGood,
        props.disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, props.ghost && styles.buttonTextGhost]}>{props.label}</Text>
    </Pressable>
  );
}

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
    item: { backgroundColor: colors.paper, borderRadius: 12, borderWidth: 1, borderColor: colors.rule, padding: space.md, gap: space.sm },
    itemDone: { opacity: 0.75 },
    top: { flexDirection: 'row', gap: space.md },
    thumbImage: { width: 58, height: 58, borderWidth: 1, borderColor: colors.rule, borderRadius: 8, backgroundColor: colors.paper },
    thumb: { width: 58, height: 58, fontSize: 34, lineHeight: 58, textAlign: 'center', borderWidth: 1, borderColor: colors.rule, borderRadius: 8 },
    info: { flex: 1, gap: 4 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
    title: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 18, color: colors.ink, flexShrink: 1 },
    price: { fontFamily: fonts.display, fontSize: 15, color: colors.red, fontVariant: ['lining-nums'] },
    meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.md, rowGap: 2 },
    metaText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft },
    stars: { fontFamily: fonts.hand, fontSize: 18, color: colors.biro },
    link: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.blue, textDecorationLine: 'underline' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
    hint: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
    pill: { fontFamily: fonts.bodyBold, fontSize: 13, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10, overflow: 'hidden' },
    pillHeld: { backgroundColor: '#fff3c2', color: '#6b5200' },
    pillBought: { backgroundColor: '#dff3e8', color: colors.good },
    group: { backgroundColor: colors.paper2, borderRadius: 8, padding: space.md, gap: 6 },
    groupTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
    groupText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
    track: { height: 8, borderRadius: 4, backgroundColor: colors.rule, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4, backgroundColor: colors.good },
    otherInput: {
      width: 84,
      borderWidth: 2,
      borderColor: colors.blue,
      borderRadius: 8,
      paddingVertical: 5,
      paddingHorizontal: 8,
      fontFamily: fonts.bodyBold,
      fontSize: 14,
      color: colors.ink,
      backgroundColor: colors.paper,
    },
    button: { backgroundColor: colors.blue, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 2, borderColor: colors.blue },
    buttonGhost: { backgroundColor: 'transparent' },
    buttonGood: { backgroundColor: colors.good, borderColor: colors.good },
    buttonDisabled: { opacity: 0.4 },
    buttonPressed: { transform: [{ translateY: 1 }] },
    buttonText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.paper },
    buttonTextGhost: { color: colors.blue },
  });
