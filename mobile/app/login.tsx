import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const { login, token, loading } = useAuth();
  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@mosque.local', password: 'Admin12345!' },
  });

  if (!loading && token) return <Redirect href="/" />;

  async function onSubmit(values: LoginForm) {
    try {
      await login(values.email, values.password);
      router.replace('/');
    } catch (error) {
      Alert.alert('تعذر الدخول', error instanceof Error ? error.message : 'تحقق من البيانات');
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="title">ملفات المساجد</AppText>
        <AppText color={colors.muted}>متابعة الوثائق، الاستفادات، الاستهلاك وتقدم الأشغال</AppText>
      </View>
      <AppCard style={styles.card}>
        <AppText variant="subtitle">دخول الموظفين</AppText>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <ThemedInput
              label="البريد الإلكتروني"
              icon={Mail}
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <ThemedInput
              label="كلمة المرور"
              icon={Lock}
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <ThemedButton title="دخول" onPress={handleSubmit(onSubmit)} disabled={formState.isSubmitting} />
        <AppText variant="caption" color={colors.muted}>بيانات العرض: admin@mosque.local / Admin12345!</AppText>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 34,
    gap: 8,
  },
  card: {
    gap: 14,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
});

