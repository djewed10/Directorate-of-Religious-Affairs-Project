import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

export const lightColors = {
  primary: '#0F766E',
  primarySoft: '#CCFBF1',
  background: '#F6F7F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2EF',
  text: '#14211F',
  muted: '#66756F',
  border: '#D8E0DC',
  success: '#15803D',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
  shadow: '#0B1F1B',
};

export const darkColors = {
  primary: '#5EEAD4',
  primarySoft: '#134E4A',
  background: '#091311',
  surface: '#10201D',
  surfaceMuted: '#182A26',
  text: '#ECFDF5',
  muted: '#A8B8B2',
  border: '#28413B',
  success: '#4ADE80',
  warning: '#FDBA74',
  danger: '#F87171',
  info: '#93C5FD',
  shadow: '#000000',
};

export type AppColors = typeof lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
};

interface ThemeValue {
  mode: NonNullable<ColorSchemeName>;
  colors: AppColors;
  spacing: typeof spacing;
  radii: typeof radii;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme() ?? 'light';
  const value = useMemo(
    () => ({
      mode: scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      spacing,
      radii,
    }),
    [scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside ThemeProvider');
  return value;
}

