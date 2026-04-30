import { router } from 'expo-router';
import { FileCog, LogOut, Moon, Shield } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { useAuth } from '@/auth/AuthProvider';
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
        <Shield color={colors.primary} size={24} />
        <View style={styles.cardText}>
          <AppText variant="subtitle">{user?.name}</AppText>
          <AppText color={colors.muted}>{user?.email} - {user?.role}</AppText>
        </View>
      </AppCard>
      <AppCard onPress={() => router.push('/document-types')} style={styles.menu}>
        <FileCog color={colors.primary} size={22} />
        <AppText>إدارة أنواع الوثائق</AppText>
      </AppCard>
      <AppCard style={styles.menu}>
        <Moon color={colors.primary} size={22} />
        <AppText>الوضع الداكن/الفاتح يتبع إعداد الجهاز</AppText>
      </AppCard>
      <ThemedButton title="تسجيل الخروج" icon={LogOut} tone="danger" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  menu: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
});

