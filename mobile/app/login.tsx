import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { useAuth } from '@/auth/AuthProvider';
import { IconBadge, useToast } from '@/components/ui';
import { EnvelopeSimple, LockKey, Mosque } from '@/components/ui/icons';
import { useAppTheme } from '@/theme/theme';
import { Image } from 'expo-image';

const schema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const toast = useToast();
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
      toast.error(error instanceof Error ? error.message : 'تحقق من البيانات');
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Image source={require('../assets/religious-directorate-logos/religious-directorate-logo-white.webp')} alt="Mosque Dossiers" style={{ width: 120, height: 120 , borderRadius: 60}} />
        <AppText variant="title" style={styles.heroText}>تسجيل الدخول</AppText>
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
              icon={EnvelopeSimple}
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
              icon={LockKey}
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <ThemedButton title="دخول" onPress={handleSubmit(onSubmit)} disabled={formState.isSubmitting} loading={formState.isSubmitting} />
        <AppText variant="caption" color={colors.muted}>بيانات العرض: admin@mosque.local / Admin12345!</AppText>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 34,
    alignItems: 'center',
    gap: 8,
  },
  heroText: {
    textAlign: 'center',
  },
  card: {
    gap: 14,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
});
