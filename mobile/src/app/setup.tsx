import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton } from '@/components/big-button';
import { ChoiceCard } from '@/components/choice-card';
import { defaultKidPricesShown, featuresFor, finishSettings, parseMoneyInput, setupProblem, templates } from '@/domain/settings';
import type { AgeBand, ListSettings } from '@/domain/types';
import { formatMoney } from '@/domain/wishlist';
import { useWishlist } from '@/state/wishlist-store';
import { colors, fonts, radius, space } from '@/theme/tokens';

const STEPS = ['Occasion', 'Circler', 'Buyers', 'Budget'] as const;
const AGE_BANDS: AgeBand[] = ['3-5', '6-8', '9-12'];

/**
 * List setup (brief §4): four quick questions, then the catalogue.
 * Also used later to edit the list's settings.
 */
export default function Setup() {
  const insets = useSafeAreaInsets();
  const list = useWishlist();
  const editing = list.list.setupComplete;
  const [draft, setDraft] = useState<ListSettings>(list.settings);
  const [budgetText, setBudgetText] = useState(String(list.settings.budgetMinor / 100));
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

  const last = step === STEPS.length - 1;
  const problem = last ? setupProblem(draft) : stepProblem(step, draft);
  const childName = draft.circlerName.trim() || 'your child';

  const finish = () => {
    list.completeSetup(finishSettings(draft, new Date().getFullYear()));
    if (editing) router.back();
    else router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.head, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.kicker}>{editing ? 'LIST SETTINGS' : `STEP ${step + 1} OF ${STEPS.length}`}</Text>
        <Text style={styles.heading} accessibilityRole="header">
          {
            [
              "What's the occasion?",
              "Who's circling?",
              "Who's buying?",
              'How much to spend?',
            ][step]
          }
        </Text>
        <View style={styles.progress}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.progressBar, i <= step && styles.progressOn]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 0 &&
          templates.map((t) => (
            <ChoiceCard key={t.key} icon={t.icon} label={t.label} selected={draft.template === t.key} onPress={() => set({ template: t.key })} />
          ))}

        {step === 1 && (
          <>
            <ChoiceCard
              icon="🧒"
              label="A child"
              description="You hand them the phone in Kid Mode to circle"
              selected={draft.circler === 'child'}
              onPress={() => set({ circler: 'child' })}
            />
            <ChoiceCard
              icon="🧑"
              label="A grown-up"
              description="For yourself, a partner or a couple"
              selected={draft.circler === 'adult'}
              onPress={() => set({ circler: 'adult' })}
            />
            <Text style={styles.label} nativeID="name-label">
              {draft.circler === 'child' ? "Child's first name" : 'Name for the list'}
            </Text>
            <TextInput
              value={draft.circlerName}
              onChangeText={(circlerName) => set({ circlerName })}
              placeholder={draft.circler === 'child' ? 'e.g. Ellie' : 'e.g. Sam & Alex'}
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="words"
              autoComplete="off"
              maxLength={40}
              style={styles.input}
              accessibilityLabelledBy="name-label"
            />
            {draft.circler === 'child' && (
              <>
                <Text style={styles.label}>How old?</Text>
                <View style={styles.row}>
                  {AGE_BANDS.map((band) => (
                    <ChoiceCard key={band} compact label={band} selected={draft.ageBand === band} onPress={() => set({ ageBand: band, kidPricesShown: defaultKidPricesShown(band) })} />
                  ))}
                </View>
                <Text style={styles.note}>We only use this to pick suitable products. Children never get an account.</Text>
              </>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <ChoiceCard
              icon="🙋"
              label="Just me"
              description="One buyer, so no claiming or sharing needed"
              selected={draft.buyers === 'just-me'}
              onPress={() => set({ buyers: 'just-me' })}
            />
            <ChoiceCard
              icon="👫"
              label="Me and a partner"
              description="Share the list and claim items so you don't double up"
              selected={draft.buyers === 'partner'}
              onPress={() => set({ buyers: 'partner' })}
            />
            <ChoiceCard
              icon="👨‍👩‍👧‍👦"
              label="The whole family"
              description="Grandparents, aunties, uncles: claiming, surprise mode and group gifts"
              selected={draft.buyers === 'family'}
              onPress={() => set({ buyers: 'family' })}
            />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.label} nativeID="budget-label">
              Budget
            </Text>
            <View style={styles.moneyRow}>
              <Text style={styles.currency}>£</Text>
              <TextInput
                value={budgetText}
                onChangeText={(text) => {
                  setBudgetText(text);
                  const minor = parseMoneyInput(text);
                  set({ budgetMinor: minor ?? 0 });
                }}
                keyboardType="decimal-pad"
                style={[styles.input, styles.moneyInput]}
                accessibilityLabelledBy="budget-label"
              />
            </View>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchLabel}>Show a running total</Text>
                <Text style={styles.note}>Adds up everything circled against the budget</Text>
              </View>
              <Switch
                value={draft.runningTotalOn}
                onValueChange={(runningTotalOn) => set({ runningTotalOn })}
                trackColor={{ true: colors.blue, false: colors.rule }}
                thumbColor={draft.runningTotalOn ? colors.yellow : colors.paper}
                accessibilityLabel="Show a running total"
              />
            </View>
            {draft.circler === 'child' && (
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel}>Show prices in Kid Mode</Text>
                  <Text style={styles.note}>Off for under-8s, so they circle what they love, not what costs least.</Text>
                </View>
                <Switch
                  value={draft.kidPricesShown}
                  onValueChange={(kidPricesShown) => set({ kidPricesShown })}
                  trackColor={{ true: colors.blue, false: colors.rule }}
                  thumbColor={draft.kidPricesShown ? colors.yellow : colors.paper}
                  accessibilityLabel="Show prices in Kid Mode"
                />
              </View>
            )}
            {featuresFor(draft.buyers).claiming && (
              <>
                <Text style={styles.label}>Surprise mode</Text>
                <ChoiceCard
                  compact
                  label={`${draft.circler === 'child' ? childName : 'You'} can see "taken care of"`}
                  selected={draft.surpriseMode === 'taken-care-of'}
                  onPress={() => set({ surpriseMode: 'taken-care-of' })}
                />
                <ChoiceCard
                  compact
                  label="Hide everything"
                  selected={draft.surpriseMode === 'hide-all'}
                  onPress={() => set({ surpriseMode: 'hide-all' })}
                />
                <Text style={styles.note}>Nobody on the list side ever sees who bought what.</Text>
              </>
            )}
            {draft.budgetMinor > 0 && (
              <Text style={styles.summary}>
                {`${formatMoney(draft.budgetMinor)} for ${draft.circlerName.trim() || 'this list'}`}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        {tried && problem && (
          <Text style={styles.problem} accessibilityLiveRegion="polite">
            {problem}
          </Text>
        )}
        <View style={styles.row}>
          {(step > 0 || editing) && (
            <BigButton
              label={step > 0 ? '◀ Back' : 'Cancel'}
              tone="yellow"
              onPress={() => (step > 0 ? goTo(step - 1) : router.back())}
            />
          )}
          <BigButton
            grow
            label={last ? (editing ? 'Save' : 'Make my catalogue!') : 'Next ▶'}
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
  );
}

/** Problems that stop each step moving on. The last step checks everything. */
function stepProblem(step: number, draft: ListSettings): string | null {
  if (step !== 1) return null;
  const all = setupProblem(draft);
  return all === 'Set a budget above zero' ? null : all;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper2 },
  head: { backgroundColor: colors.red, paddingHorizontal: space.lg, paddingBottom: space.lg },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.4, color: colors.paper, opacity: 0.9 },
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
