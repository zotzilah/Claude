import * as Haptics from 'expo-haptics';
import { useImperativeHandle, useState, type ReactNode, type Ref } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { playSfx } from '@/audio/sfx';
import { colors } from '@/theme/tokens';

/** How far a page swings open around the spine, in degrees. Past 90 it's out of sight. */
const OPEN = -105;
const TURN_MS = 480;
/** Horizontal swipe distance that counts as a page turn. */
const SWIPE = 60;

interface Turn {
  from: number;
  to: number;
  dir: 1 | -1;
  /** `landing`: the turn has finished but the new page hasn't rendered underneath yet. */
  phase: 'turning' | 'landing';
}

export interface PageTurnerHandle {
  turn: (dir: 1 | -1) => void;
}

interface Props {
  page: number;
  pageCount: number;
  renderPage: (index: number) => ReactNode;
  onChangePage: (index: number) => void;
  ref?: Ref<PageTurnerHandle>;
}

/**
 * Catalogue pages that turn like paper: swipe left or right (or call `turn`) and the
 * page swings round its left-hand spine with a rustle. Vertical scrolling still works.
 *
 * Turning forward: the old page swings away on top, revealing the new one beneath.
 * Turning back: the previous page swings back in on top of the current one.
 */
export function PageTurner({ page, pageCount, renderPage, onChangePage, ref }: Props) {
  const reducedMotion = useReducedMotion();
  const [turn, setTurn] = useState<Turn | null>(null);
  const angle = useSharedValue(0);
  const turning = turn?.phase === 'turning';

  const land = (to: number) => {
    onChangePage(to);
    setTurn({ from: page, to, dir: -1, phase: 'landing' });
  };

  const start = (dir: 1 | -1) => {
    const to = page + dir;
    if (turning || to < 0 || to >= pageCount) return;
    playSfx('rustle');
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (reducedMotion) {
      onChangePage(to);
      return;
    }
    const easing = Easing.bezier(0.45, 0.05, 0.55, 0.95);
    setTurn({ from: page, to, dir, phase: 'turning' });
    if (dir === 1) {
      // The new page goes underneath straight away; the old one swings off on top.
      onChangePage(to);
      angle.set(0);
      angle.set(withTiming(OPEN, { duration: TURN_MS, easing }, (done) => {
        if (done) scheduleOnRN(setTurn, null);
      }));
    } else {
      angle.set(OPEN);
      angle.set(withTiming(0, { duration: TURN_MS, easing }, (done) => {
        if (done) scheduleOnRN(land, to);
      }));
    }
  };

  useImperativeHandle(ref, () => ({ turn: start }));

  const swipe = usePanGesture({
    activeOffsetX: [-20, 20],
    failOffsetY: [-14, 14],
    runOnJS: true,
    onDeactivate: (e) => {
      if (e.translationX <= -SWIPE) start(1);
      else if (e.translationX >= SWIPE) start(-1);
    },
  });

  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1400 }, { rotateY: `${angle.get()}deg` }],
  }));
  // The sheet stays solid; it darkens as it swings away from the light, like real paper.
  const shadeStyle = useAnimatedStyle(() => ({ opacity: (angle.get() / OPEN) * 0.35 }));

  // While turning back, the current page stays underneath until the turn lands.
  const basePage = turning && turn.dir === -1 ? turn.from : page;
  // The flipping sheet: the old page when going forward, the incoming page when going back.
  // After a backward turn it stays put (flat) until the new page has rendered beneath it.
  const sheetPage = turn && (turning || page !== turn.to) ? (turn.dir === 1 ? turn.from : turn.to) : null;

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.stage}>
        <View style={StyleSheet.absoluteFill}>{renderPage(basePage)}</View>
        {sheetPage !== null && (
          <Animated.View style={[StyleSheet.absoluteFill, styles.sheet, flipStyle]} pointerEvents="none">
            {renderPage(sheetPage)}
            <Animated.View style={[StyleSheet.absoluteFill, styles.shade, shadeStyle]} />
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, overflow: 'hidden', backgroundColor: colors.paper2 },
  sheet: {
    backgroundColor: colors.paper,
    transformOrigin: ['0%', '50%', 0],
    backfaceVisibility: 'hidden',
    boxShadow: '8px 0 24px rgba(0,0,0,0.25)',
  },
  shade: { backgroundColor: '#000' },
});
