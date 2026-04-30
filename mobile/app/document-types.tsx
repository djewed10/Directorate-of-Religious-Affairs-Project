import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { apiFetch } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';

const groups = [
  { key: 'mosque_file', label: 'ملف المسجد' },
  { key: 'association_file', label: 'ملف الجمعية' },
  { key: 'technical', label: 'تقنية' },
  { key: 'financial', label: 'مالية' },
  { key: 'consumption', label: 'استهلاك' },
  { key: 'progression', label: 'تقدم' },
  { key: 'other', label: 'أخرى' },
];

export default function DocumentTypesScreen() {
  const { token, loading, user } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [labelAr, setLabelAr] = useState('');
  const [code, setCode] = useState('');
  const [group, setGroup] = useState('other');
  const [supportsExpiration, setSupportsExpiration] = useState('false');
  const types = useQuery({ queryKey: ['document-types'], queryFn: api.documentTypes, enabled: !!token });
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/document-types', {
        method: 'POST',
        body: {
          labelAr,
          code: code || labelAr.trim().replace(/\s+/g, '_'),
          group,
          supportsExpiration: supportsExpiration === 'true',
          retentionPolicy: 'replace_after_confirmation',
        },
      }),
    onSuccess: async () => {
      setLabelAr('');
      setCode('');
      await queryClient.invalidateQueries({ queryKey: ['document-types'] });
    },
    onError: (error) => Alert.alert('تعذر الإضافة', error instanceof Error ? error.message : 'خطأ غير معروف'),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Screen>
      <View>
        <AppText variant="title">أنواع الوثائق</AppText>
        <AppText color={colors.muted}>الواجهات تقرأ التسميات من قاعدة البيانات وليست ثابتة داخل التطبيق</AppText>
      </View>
      {user?.role === 'admin' || user?.role === 'manager' ? (
        <AppCard style={styles.form}>
          <AppText variant="subtitle">إضافة نوع جديد</AppText>
          <ThemedInput label="التسمية بالعربية" value={labelAr} onChangeText={setLabelAr} />
          <ThemedInput label="الكود الداخلي" value={code} onChangeText={setCode} placeholder="new_document_type" />
          <FilterChips chips={groups} value={group} onChange={setGroup} />
          <FilterChips
            chips={[
              { key: 'false', label: 'بدون انتهاء' },
              { key: 'true', label: 'يدعم الانتهاء' },
            ]}
            value={supportsExpiration}
            onChange={setSupportsExpiration}
          />
          <ThemedButton title="إضافة النوع" icon={Plus} disabled={!labelAr || mutation.isPending} onPress={() => mutation.mutate()} />
        </AppCard>
      ) : null}
      <View style={styles.list}>
        {types.data?.map((type) => (
          <AppCard key={type.id} style={styles.item}>
            <View style={styles.itemHead}>
              <AppText variant="subtitle">{type.labelAr}</AppText>
              <AppText variant="caption" color={type.supportsExpiration ? colors.warning : colors.info}>
                {type.supportsExpiration ? 'يدعم الصلاحية' : 'بدون صلاحية'}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.muted}>{type.code} - {type.group}</AppText>
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  list: {
    gap: 10,
  },
  item: {
    gap: 6,
  },
  itemHead: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 10,
  },
});

