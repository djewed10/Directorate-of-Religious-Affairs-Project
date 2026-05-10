import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { useAuth } from '@/auth/AuthProvider';
import { GearSix, IconBadge, MoonStars, ShieldCheck, SignOut } from '@/components/ui';
import { useAppTheme } from '@/theme/theme';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  return (
    <Screen>
      <View>
        <AppText variant="title">الإعدادات</AppText>
        <AppText color={colors.muted}>إدارة الأنواع، المستخدمين، والتفضيلات</AppText>
      </View>
      <AppCard style={styles.card}>
        <IconBadge icon={ShieldCheck} tone="primary" size={46} iconSize={23} />
        <View style={styles.cardText}>
          <AppText variant="subtitle">{user?.name}</AppText>
          <AppText color={colors.muted}>{user?.email} - {user?.role}</AppText>
        </View>
      </AppCard>
      <AppCard onPress={() => router.push('/document-types')} style={styles.menu}>
        <IconBadge icon={GearSix} tone="primary" size={40} iconSize={21} />
        <AppText>إدارة أنواع الوثائق</AppText>
      </AppCard>
      <AppCard style={styles.menu}>
        <IconBadge icon={MoonStars} tone="primary" size={40} iconSize={21} />
        <AppText>الوضع الداكن/الفاتح يتبع إعداد الجهاز</AppText>
      </AppCard>
      <ThemedButton title="تسجيل الخروج" icon={SignOut} tone="danger" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
