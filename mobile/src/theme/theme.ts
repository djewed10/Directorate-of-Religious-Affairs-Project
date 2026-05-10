import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import * as SplashScreen from 'expo-splash-screen';
import React, { PropsWithChildren, createContext, useContext, useEffect, useMemo } from 'react';
import { ColorSchemeName, Platform, useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const lightTheme = {
  background: '#F1F2F6',
  backgroundAlt: '#EAEBEF',
  surface: '#FFFFFF',
  elevatedSurface: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F6F7FA',

  textPrimary: '#111827',
  textSecondary: '#475569',
  textMuted: '#8A94A6',

  border: '#DEE3EA',
  divider: '#ECEFF4',

  primary: '#0072CE',
  primarySoft: '#E7F2FC',
  primaryPressed: '#005EA8',

  secondary: '#208F78',
  secondarySoft: '#DDF3EE',

  success: '#16A06D',
  successSoft: '#DDF8EC',

  warning: '#D98A12',
  warningSoft: '#FFF3D6',

  danger: '#cc5c5c',
  dangerSoft: '#FDE3E3',

  info: '#0EA5E9',
  infoSoft: '#E0F2FE',

  tabBar: '#FFFFFF',
  tabActive: '#387cb4',
  tabInactive: '#8A94A6',
  tabBarBorder: '#DEE3EA',

  shadow: 'rgba(17, 24, 39, 0.08)',
  shadowStrong: 'rgba(17, 24, 39, 0.14)',
  overlay: 'rgba(15, 23, 42, 0.36)',
  transparent: 'transparent',
  white: '#FFFFFF',
  onPrimary: '#FFFFFF',
};

export const darkTheme = {
  background: '#0B1018',
  backgroundAlt: '#101722',
  surface: '#151D2A',
  elevatedSurface: '#1B2534',
  card: '#182233',
  cardAlt: '#202B3C',

  textPrimary: '#F3F7FB',
  textSecondary: '#B5C2D3',
  textMuted: '#718096',

  border: '#2A3547',
  divider: '#202B3C',

  primary: '#4EA3F1',
  primarySoft: '#102B46',
  primaryPressed: '#2D8AD8',

  secondary: '#3BC0AA',
  secondarySoft: '#123D37',

  success: '#2DD48F',
  successSoft: '#0F3A2D',

  warning: '#F5B849',
  warningSoft: '#3A2A0C',

  danger: '#c95757',
  dangerSoft: '#3B1717',

  info: '#38BDF8',
  infoSoft: '#0B3147',

  tabBar: '#151D2A',
  tabActive: '#ffffff',
  tabInactive: '#718096',
  tabBarBorder: '#2A3547',

  shadow: 'rgba(0, 0, 0, 0.40)',
  shadowStrong: 'rgba(0, 0, 0, 0.65)',
  overlay: 'rgba(0, 0, 0, 0.58)',
  transparent: 'transparent',
  white: '#FFFFFF',
  onPrimary: '#FFFFFF',
};

export type ThemeColors = typeof lightTheme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  families: {
    regular: Platform.select({
      web: 'IBMPlexSansArabic_400Regular, "Noto Sans Arabic", system-ui, sans-serif',
      default: 'IBMPlexSansArabic_400Regular',
    }),
    medium: Platform.select({
      web: 'IBMPlexSansArabic_500Medium, "Noto Sans Arabic", system-ui, sans-serif',
      default: 'IBMPlexSansArabic_500Medium',
    }),
    semiBold: Platform.select({
      web: 'IBMPlexSansArabic_600SemiBold, "Noto Sans Arabic", system-ui, sans-serif',
      default: 'IBMPlexSansArabic_600SemiBold',
    }),
    bold: Platform.select({
      web: 'IBMPlexSansArabic_700Bold, "Noto Sans Arabic", system-ui, sans-serif',
      default: 'IBMPlexSansArabic_700Bold',
    }),
  },
  sizes: {
    display: 30,
    title: 24,
    titleSmall: 20,
    body: 15,
    bodySmall: 13,
    caption: 12,
    metric: 28,
  },
  lineHeights: {
    display: 40,
    title: 34,
    titleSmall: 28,
    body: 23,
    bodySmall: 20,
    caption: 18,
    metric: 36,
  },
};

type ThemeMode = NonNullable<ColorSchemeName>;

interface ThemeValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors & {
    text: string;
    muted: string;
    surfaceMuted: string;
  };
  spacing: typeof spacing;
  radius: typeof radius;
  radii: typeof radius;
  typography: typeof typography;
  fontsLoaded: boolean;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme() ?? 'light';
  const [fontsLoaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  const value = useMemo<ThemeValue>(() => {
    const palette = scheme === 'dark' ? darkTheme : lightTheme;
    return {
      mode: scheme,
      isDark: scheme === 'dark',
      colors: {
        ...palette,
        text: palette.textPrimary,
        muted: palette.textMuted,
        surfaceMuted: palette.cardAlt,
      },
      spacing,
      radius,
      radii: radius,
      typography,
      fontsLoaded,
    };
  }, [fontsLoaded, scheme]);

  if (!fontsLoaded) return null;

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

export const useAppTheme = useTheme;
export type AppColors = ThemeValue['colors'];
