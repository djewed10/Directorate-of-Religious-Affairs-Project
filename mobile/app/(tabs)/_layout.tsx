import { Redirect, Tabs } from 'expo-router';
import { Bell, Home, Search, Settings, Landmark } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 64,
        },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="mosques" options={{ title: 'المساجد', tabBarIcon: ({ color }) => <Landmark color={color} size={22} /> }} />
      <Tabs.Screen name="search" options={{ title: 'البحث', tabBarIcon: ({ color }) => <Search color={color} size={22} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'التنبيهات', tabBarIcon: ({ color }) => <Bell color={color} size={22} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'الإعدادات', tabBarIcon: ({ color }) => <Settings color={color} size={22} /> }} />
    </Tabs>
  );
}

