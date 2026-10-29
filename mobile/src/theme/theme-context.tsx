import { createContext, useContext, type ReactNode } from 'react';

import { classic, type Theme, type ThemeParts } from './themes';

const ThemeContext = createContext<Theme>(classic);

/** Gives everything inside it a theme: the list's own, or a giver's view of someone else's. */
export function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

type StyleFactory<T> = (theme: ThemeParts) => T;

// One set of styles per theme and screen, made the first time it's needed.
const made = new WeakMap<Theme, Map<StyleFactory<unknown>, unknown>>();

/** Styles for a given theme, outside the usual context (e.g. setup previews the occasion being picked). */
export function stylesFor<T>(theme: Theme, factory: StyleFactory<T>): T {
  let byFactory = made.get(theme);
  if (!byFactory) {
    byFactory = new Map();
    made.set(theme, byFactory);
  }
  if (!byFactory.has(factory)) byFactory.set(factory, factory(theme));
  return byFactory.get(factory) as T;
}

/**
 * Styles for the current theme. Screens write their StyleSheet as a function of the
 * theme's colours and fonts, and get the same objects back every render.
 */
export function useThemedStyles<T>(factory: StyleFactory<T>): T {
  return stylesFor(useTheme(), factory);
}
