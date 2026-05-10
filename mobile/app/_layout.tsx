import 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { ToastProvider } from '@/components/ui';
import { setupRtl } from '@/i18n/rtl';
import { setNotificationRouterReady } from '@/notifications/navigation';
import { ThemeProvider, useAppTheme } from '@/theme/theme';

setupRtl();

function RootStack() {
  const { colors, mode } = useAppTheme();
  const { loading, token } = useAuth();
  useEffect(() => {
    if (!loading && token) setNotificationRouterReady();
  }, [loading, token]);
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [client] = useState(() => new QueryClient());
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <ToastProvider>
              <AuthProvider>
                <RootStack />
              </AuthProvider>
            </ToastProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
