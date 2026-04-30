import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width } = useWindowDimensions();
  return {
    width,
    isWide: width >= 900,
    isTablet: width >= 680,
  };
}

