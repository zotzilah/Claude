import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { ChoiceCard } from '@/components/choice-card';
import { currencyChoices, currencySymbol, moneyInputText, parseMoneyInput } from '@/domain/money';
import {
  defaultKidPricesShown,
  featuresFor,
  finishSettings,
  isGrownUpOccasion,
  setupProblem,
  templates,
  type SetupProblem,
} from '@/domain/settings';
import type { AgeBand, ListSettings } from '@/domain/types';
import { deviceLocale, useStrings } from '@/state/locale';
import { remote } from '@/state/remote';
import { useWishlist } from '@/state/wishlist-store';
import { stylesFor, ThemeProvider } from '@/theme/theme-context';
import { themeFor, type ThemeParts } from '@/theme/themes';
import { radius, space } from '@/theme/tokens';

const STEPS = ['Occasion', 'Circler', 'Buyers', 'Budget'] as const;
const AGE_BANDS: AgeBand[] = ['3-5', '6-8', '9-12'];

/**
 * List setup (brief §4): four quick questions, then the catalogue.
 * Also used later to edit the list's settings.
 */
export default function Setup() {
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const t = useStrings();
  const editing = list.list.setupComplete;
  const [draft, setDraft] = useState<ListSettings>(list.settings);
  // Setup takes on the look of the occasion being picked, so you see it straight away.
  const theme = themeFor(draft.template);
  const styles = stylesFor(theme, makeStyles);
  const { colors } = theme;
  const [budgetText, setBudgetText] = useState(() =>
    moneyInputText(list.settings.budgetMinor, list.settings.currency, deviceLocale.tag),
  );
  const [step, setStep] = useState(0);
  // Only nag about missing answers after someone tries to move on.
  const [tried, setTried] = useState(false);
  const goTo = (n: number) => {
    setStep(n);
    setTried(false);
  };
  const set = (patch: Partial<ListSettings>) => setDraft((d) => ({ ...d, ...patch }));

  // Settings are for grown-ups: Kid Mode can't reach them.
  if (list.kidMode) return <Redirect href="/kid" />;

  const grownUp = isGrownUpOccasion(draft.template);
  const last = step === STEPS.length - 1;
  const problem = last ? setupProblem(draft) : stepProblem(step, draft);
  const childName = draft.circlerName.trim() || t.common.yourChild;
  const problemText = problem ? t.setup.problems[problem] : null;
  const setCurrency = (currency: string) =>
    set({ currency, budgetMinor: parseMoneyInput(budgetText, currency, deviceLocale.tag) ?? 0 });

  const finish = () => {
    list.completeSetup(finishSettings(draft, new Date().getFullYear(), t.templates.title));
    if (editing) router.back();
    else router.replace('/');
  };

  return (
    <ThemeProvider theme={theme}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.head, { paddingTop: insets.top + space.md }]}>
          <Text style={styles.kicker}>{editing ? t.setup.kickerEditing : t.setup.kicker(step + 1, STEPS.length)}</Text>
          <Text style={styles.heading} accessibilityRole="header">
            {grownUp && step === 1 ? t.setup.whoseList : t.setup.headings[step]}
          </Text>
          <View style={styles.progress}>
            {STEPS.map((s, i) => (
              <View key={s} style={[styles.progressBar, i <= step && styles.progressOn]} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {editing && step === 0 && (
            <Pressable onPress={() => router.navigate('/account')} accessibilityRole="link" hitSlop={8} style={styles.accountLink}>
              <Text style={styles.accountLinkText}>{t.account.link}</Text>
            </Pressable>
          )}
          {step === 0 &&
            templates.map((tpl) => (
              <ChoiceCard
                key={tpl.key}
                icon={tpl.icon}
                label={t.templates.label[tpl.key]}
                selected={draft.template === tpl.key}
                // Weddings and anniversaries are always a grown-up's list.
                onPress={() => set({ template: tpl.key, ...(isGrownUpOccasion(tpl.key) ? { circler: 'adult' } : {}) })}
              />
            ))}
          {!editing && step === 0 && remote() && (
            <Pressable onPress={() => router.push('/restore')} accessibilityRole="link" hitSlop={8} style={styles.accountLink}>
              <Text style={styles.accountLinkText}>{t.restore.link}</Text>
            </Pressable>
          )}

          {step === 1 && (
            <>
              {!grownUp && (
                <>
                  <ChoiceCard
                    icon="🧒"
                    label={t.setup.child}
                    description={t.setup.childNote}
                    selected={draft.circler === 'child'}
                    onPress={() => set({ circler: 'child' })}
                  />
                  <ChoiceCard
                    icon="🧑"
                    label={t.setup.adult}
                    description={t.setup.adultNote}
                    selected={draft.circler === 'adult'}
                    onPress={() => set({ circler: 'adult' })}
                  />
                </>
              )}
              <Text style={styles.label} nativeID="name-label">
                {draft.circler === 'child' ? t.setup.childName : grownUp ? t.setup.coupleName : t.setup.listName}
              </Text>
              <TextInput
                value={draft.circlerName}
                onChangeText={(circlerName) => set({ circlerName })}
                placeholder={draft.circler === 'child' ? t.setup.childNameExample : t.setup.listNameExample}
                placeholderTextColor={colors.inkSoft}
                autoCapitalize="words"
                autoComplete="off"
                maxLength={40}
                style={styles.input}
                accessibilityLabelledBy="name-label"
              />
              {draft.circler === 'child' && (
                <>
                  <Text style={styles.label}>{t.setup.howOld}</Text>
                  <View style={styles.row}>
                    {AGE_BANDS.map((band) => (
                      <ChoiceCard key={band} compact label={band} selected={draft.ageBand === band} onPress={() => set({ ageBand: band, kidPricesShown: defaultKidPricesShown(band) })} />
                    ))}
                  </View>
                  <Text style={styles.note}>{t.setup.ageNote}</Text>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <ChoiceCard
                icon="🙋"
                label={t.setup.justMe}
                description={t.setup.justMeNote}
                selected={draft.buyers === 'just-me'}
                onPress={() => set({ buyers: 'just-me' })}
              />
              <ChoiceCard
                icon="👫"
                label={t.setup.partner}
                description={t.setup.partnerNote}
                selected={draft.buyers === 'partner'}
                onPress={() => set({ buyers: 'partner' })}
              />
              <ChoiceCard
                icon="👨‍👩‍👧‍👦"
                label={t.setup.family}
                description={t.setup.familyNote}
                selected={draft.buyers === 'family'}
                onPress={() => set({ buyers: 'family' })}
              />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.label} nativeID="budget-label">
                {t.setup.budget}
              </Text>
              <View style={styles.moneyRow}>
                <Text style={styles.currency}>{currencySymbol(draft.currency, deviceLocale.tag)}</Text>
                <TextInput
                  value={budgetText}
                  onChangeText={(text) => {
                    setBudgetText(text);
                    const minor = parseMoneyInput(text, draft.currency, deviceLocale.tag);
                    set({ budgetMinor: minor ?? 0 });
                  }}
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.moneyInput]}
                  accessibilityLabelledBy="budget-label"
                />
              </View>
              <Text style={styles.label}>{t.setup.currency}</Text>
              <View style={styles.row}>
                {currencyChoices(draft.currency).map((code) => (
                  <ChoiceCard
                    key={code}
                    compact
                    label={`${currencySymbol(code, deviceLocale.tag)} ${code}`}
                    selected={draft.currency === code}
                    onPress={() => setCurrency(code)}
                  />
                ))}
              </View>
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel}>{t.setup.runningTotal}</Text>
                  <Text style={styles.note}>{t.setup.runningTotalNote}</Text>
                </View>
                <Switch
                  value={draft.runningTotalOn}
                  onValueChange={(runningTotalOn) => set({ runningTotalOn })}
                  trackColor={{ true: colors.blue, false: colors.rule }}
                  thumbColor={draft.runningTotalOn ? colors.yellow : colors.paper}
                  accessibilityLabel={t.setup.runningTotal}
                />
              </View>
              {draft.circler === 'child' && (
                <View style={styles.switchRow}>
                  <View style={styles.switchText}>
                    <Text style={styles.switchLabel}>{t.setup.kidPrices}</Text>
                    <Text style={styles.note}>{t.setup.kidPricesNote}</Text>
                  </View>
                  <Switch
                    value={draft.kidPricesShown}
                    onValueChange={(kidPricesShown) => set({ kidPricesShown })}
                    trackColor={{ true: colors.blue, false: colors.rule }}
                    thumbColor={draft.kidPricesShown ? colors.yellow : colors.paper}
                    accessibilityLabel={t.setup.kidPrices}
                  />
                </View>
              )}
              {featuresFor(draft.buyers).claiming && (
                <>
                  <Text style={styles.label}>{t.setup.surprise}</Text>
                  <ChoiceCard
                    compact
                    label={t.setup.surpriseOff}
                    selected={draft.surpriseMode === 'off'}
                    onPress={() => set({ surpriseMode: 'off' })}
                  />
                  <ChoiceCard
                    compact
                    label={t.setup.surpriseCovered}
                    selected={draft.surpriseMode === 'taken-care-of'}
                    onPress={() => set({ surpriseMode: 'taken-care-of' })}
                  />
                  <ChoiceCard
                    compact
                    label={t.setup.surpriseHideAll}
                    selected={draft.surpriseMode === 'hide-all'}
                    onPress={() => set({ surpriseMode: 'hide-all' })}
                  />
                  <Text style={styles.note}>
                    {draft.surpriseMode === 'off'
                      ? t.setup.surpriseOffNote(draft.circler === 'child' ? childName : null)
                      : t.setup.surpriseOnNote}
                  </Text>
                </>
              )}
              {draft.budgetMinor > 0 && (
                <Text style={styles.summary}>
                  {t.setup.summary(list.money(draft.budgetMinor, draft.currency), draft.circlerName.trim())}
                </Text>
              )}
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          {tried && problemText && (
            <Text style={styles.problem} accessibilityLiveRegion="polite">
              {problemText}
            </Text>
          )}
          <View style={styles.row}>
            {(step > 0 || editing) && (
              <BigButton
                label={step > 0 ? t.common.back : t.common.cancel}
                tone="yellow"
                onPress={() => (step > 0 ? goTo(step - 1) : router.back())}
              />
            )}
            <BigButton
              grow
              label={last ? (editing ? t.common.save : t.setup.finish) : t.common.next}
              onPress={() => {
                if (problem) {
                  setTried(true);
                  return;
                }
                if (last) finish();
                else goTo(step + 1);
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemeProvider>
  );
}

/** Problems that stop each step moving on. The last step checks everything. */
function stepProblem(step: number, draft: ListSettings): SetupProblem | null {
  if (step !== 1) return null;
  const all = setupProblem(draft);
  return all === 'budget' ? null : all;
}

const makeStyles = ({ colors, fonts }: ThemeParts) =>
  StyleSheet.create({
    accountLink: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' },
    accountLinkText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.blue, textDecorationLine: 'underline' },
    screen: { flex: 1, backgroundColor: colors.paper2 },
    head: { backgroundColor: colors.red, paddingHorizontal: space.lg, paddingBottom: space.lg },
    kicker: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.4, color: colors.paper },
    heading: { fontFamily: fonts.display, fontSize: 28, color: colors.paper, marginTop: 4 },
    progress: { flexDirection: 'row', gap: 6, marginTop: space.md },
    progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
    progressOn: { backgroundColor: colors.yellow },
    body: { padding: space.lg, gap: space.md },
    label: { fontFamily: fonts.display, fontSize: 16, color: colors.ink, marginTop: space.sm },
    input: {
      backgroundColor: colors.paper,
      borderWidth: 2,
      borderColor: colors.ink,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      paddingVertical: space.md,
      fontFamily: fonts.bodySemi,
      fontSize: 18,
      color: colors.ink,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    note: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
    moneyRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    currency: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
    moneyInput: { flex: 1, minWidth: 0, fontFamily: fonts.display, fontSize: 24 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
    switchText: { flex: 1 },
    switchLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
    summary: { fontFamily: fonts.hand, fontSize: 22, color: colors.biro, textAlign: 'center', marginTop: space.md },
    footer: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.sm, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.rule },
    problem: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.red, textAlign: 'center' },
  });
