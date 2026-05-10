import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { BottomTabBar } from '@/components/ui';
import { Bell, GearSix, House, MagnifyingGlass, Mosque } from '@/components/ui/icons';
import { useAppTheme } from '@/theme/theme';

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: ({ color, size, focused }) => <House color={color} size={size} weight={focused ? 'duotone' : 'regular'} /> }} />
      <Tabs.Screen name="mosques" options={{ title: 'المساجد', tabBarIcon: ({ color, size, focused }) => <Mosque color={color} size={size} weight={focused ? 'duotone' : 'regular'} /> }} />
      <Tabs.Screen name="search" options={{ title: 'البحث', tabBarIcon: ({ color, size, focused }) => <MagnifyingGlass color={color} size={size} weight={focused ? 'duotone' : 'regular'} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'التنبيهات', tabBarIcon: ({ color, size, focused }) => <Bell color={color} size={size} weight={focused ? 'duotone' : 'regular'} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'الإعدادات', tabBarIcon: ({ color, size, focused }) => <GearSix color={color} size={size} weight={focused ? 'duotone' : 'regular'} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
