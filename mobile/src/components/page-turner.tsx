import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { playSfx } from '@/audio/sfx';
import { useThemedStyles } from '@/theme/theme-context';
import type { ThemeParts } from '@/theme/themes';

/** How far a page swings open around the spine, in degrees. Past 90 it's out of sight. */
const OPEN = -105;
const TURN_MS = 480;
/** Let go past this much of the page width (or flick) and the page turns; otherwise it falls back. */
const COMMIT_AT = 0.35;
const FLICK_SPEED = 500;
/** Where the paper bends: the outer part of the page lags behind, like a real sheet. */
const FOLD = 0.58;
/** The most the outer part bends, in degrees, halfway through a turn. */
const CURL = 38;
/** How far a finger must move before we decide which way the page is turning. */
const DECIDE_PX = 8;

interface Turn {
  from: number;
  to: number;
  dir: 1 | -1;
  /** `dragging`/`settling`: in motion. `landing`: done, waiting for the new page to render beneath. */
  phase: 'dragging' | 'settling' | 'landing';
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
 * Catalogue pages that turn like paper (issue #21). Drag sideways and the page follows your
 * finger, bending as it goes: the outer edge lags behind the spine, with a sheen along the
 * fold and the shadow deepening. Let go past a third of the way (or flick) and it turns with
 * a rustle; otherwise it falls back. The arrow buttons call `turn`. Vertical scrolling still
 * works, and Reduce Motion skips straight to the next page.
 */
export function PageTurner({ page, pageCount, renderPage, onChangePage, ref }: Props) {
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = useReducedMotion();
  const [turn, setTurn] = useState<Turn | null>(null);
  const [width, setWidth] = useState(0);
  /** 0 → 1 through the turn, whichever way it goes. */
  const progress = useSharedValue(0);
  const dir = useSharedValue<1 | -1>(1);
  /** The turn a finger is dragging right now. A ref, so gesture events never act on a stale one. */
  const drag = useRef<Turn | null>(null);

  // A finished turn holds the sheet in place until the new page has rendered underneath;
  // once it has, the turn is over.
  const active = turn && !(turn.phase === 'landing' && page === turn.to) ? turn : null;

  const begin = (d: 1 | -1): Turn | null => {
    const to = page + d;
    if (active || drag.current || to < 0 || to >= pageCount) return null;
    const next: Turn = { from: page, to, dir: d, phase: 'dragging' };
    dir.set(d);
    progress.set(0);
    setTurn(next);
    return next;
  };

  const finish = (commit: boolean, from: Turn) => {
    if (commit) {
      onChangePage(from.to);
      setTurn({ ...from, phase: 'landing' });
    } else {
      setTurn(null);
    }
  };

  const settle = (commit: boolean, current: Turn) => {
    if (commit) {
      playSfx('rustle');
      if (Platform.OS !== 'web') Haptics.selectionAsync();
    }
    setTurn({ ...current, phase: 'settling' });
    const remaining = commit ? 1 - progress.get() : progress.get();
    progress.set(
      withTiming(commit ? 1 : 0, { duration: Math.max(140, TURN_MS * remaining), easing: Easing.out(Easing.quad) }, (done) => {
        if (done) scheduleOnRN(finish, commit, current);
      }),
    );
  };

  const turnNow = (d: 1 | -1) => {
    const to = page + d;
    if (active || to < 0 || to >= pageCount) return;
    if (reducedMotion) {
      playSfx('rustle');
      onChangePage(to);
      return;
    }
    const next = begin(d);
    if (next) settle(true, next);
  };

  useImperativeHandle(ref, () => ({ turn: turnNow }));

  const swipe = usePanGesture({
    activeOffsetX: [-20, 20],
    failOffsetY: [-14, 14],
    runOnJS: true,
    onUpdate: (e) => {
      if (reducedMotion || width === 0) return;
      // Pick the direction once the finger has clearly moved (some platforms report the
      // gesture before it has moved at all). Forward is a drag leftwards.
      if (!drag.current && !active && Math.abs(e.translationX) >= DECIDE_PX) {
        drag.current = begin(e.translationX < 0 ? 1 : -1);
      }
      const current = drag.current;
      if (!current) return;
      // Forward turns are dragged leftwards, backward turns rightwards.
      progress.set(Math.min(1, Math.max(0, (-e.translationX * current.dir) / width)));
    },
    onDeactivate: (e) => {
      if (reducedMotion) {
        if (e.translationX <= -60) turnNow(1);
        else if (e.translationX >= 60) turnNow(-1);
        return;
      }
      const current = drag.current;
      if (!current) return;
      drag.current = null;
      const flick = -e.velocityX * current.dir > FLICK_SPEED;
      settle(progress.get() > COMMIT_AT || flick, current);
    },
    onFinalize: () => {
      // A drag cut short (a scroll took over, say) falls back.
      const current = drag.current;
      if (!current) return;
      drag.current = null;
      settle(false, current);
    },
  });

  // The whole sheet swings round the spine; forward it opens, backward it closes.
  const sheetStyle = useAnimatedStyle(() => {
    const open = dir.get() === 1 ? progress.get() : 1 - progress.get();
    return { transform: [{ perspective: 1400 }, { rotateY: `${OPEN * open}deg` }] };
  });
  // The outer part bends most in the middle of a turn, flat at either end.
  const curlStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1400 }, { rotateY: `${-CURL * Math.sin(Math.PI * progress.get())}deg` }],
  }));
  const shadeStyle = useAnimatedStyle(() => {
    const open = dir.get() === 1 ? progress.get() : 1 - progress.get();
    return { opacity: open * 0.3 };
  });
  const outerShadeStyle = useAnimatedStyle(() => {
    const open = dir.get() === 1 ? progress.get() : 1 - progress.get();
    return { opacity: open * 0.3 + Math.sin(Math.PI * progress.get()) * 0.18 };
  });
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.sin(Math.PI * progress.get()), [0, 1], [0, 0.9]),
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // Forward: the new page waits underneath while the old one lifts away.
  // Backward: the current page stays underneath while the previous one comes back over it.
  const basePage = active && active.phase !== 'landing' ? (active.dir === 1 ? active.to : active.from) : page;
  const sheetPage = active ? (active.dir === 1 ? active.from : active.to) : null;
  // After a forward turn lands the sheet is out of sight; after a backward one it lies flat on top.
  const showSheet = sheetPage !== null && !(active?.phase === 'landing' && active.dir === 1);
  const foldX = width * FOLD;

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.stage} onLayout={onLayout}>
        <View style={StyleSheet.absoluteFill}>{renderPage(basePage)}</View>
        {showSheet && width > 0 && (
          <Animated.View style={[StyleSheet.absoluteFill, styles.sheet, sheetStyle]} pointerEvents="none">
            {/* The part of the page nearest the spine. */}
            <View style={[styles.strip, { width: foldX }]}>
              <View style={{ width }}>{renderPage(sheetPage)}</View>
              <Animated.View style={[StyleSheet.absoluteFill, styles.shade, shadeStyle]} />
            </View>
            {/* The outer part, hinged at the fold so it can bend. */}
            <Animated.View style={[styles.strip, styles.outer, { left: foldX, width: width - foldX }, curlStyle]}>
              <View style={{ width, transform: [{ translateX: -foldX }] }}>{renderPage(sheetPage)}</View>
              <Animated.View style={[StyleSheet.absoluteFill, styles.shade, outerShadeStyle]} />
              <Animated.View style={[styles.sheen, sheenStyle]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

const makeStyles = ({ colors }: ThemeParts) =>
  StyleSheet.create({
    stage: { flex: 1, overflow: 'hidden', backgroundColor: colors.paper2 },
    sheet: {
      transformOrigin: ['0%', '50%', 0],
      backfaceVisibility: 'hidden',
      boxShadow: '8px 0 24px rgba(0,0,0,0.25)',
    },
    strip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden', backgroundColor: colors.paper },
    outer: { transformOrigin: ['0%', '50%', 0], boxShadow: '6px 0 18px rgba(0,0,0,0.18)' },
    shade: { backgroundColor: '#000' },
    sheen: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 46 },
  });
