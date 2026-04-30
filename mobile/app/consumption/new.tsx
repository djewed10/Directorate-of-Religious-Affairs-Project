import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { UploadPicker, type PickedUpload } from '@/components/UploadPicker';
import { useAuth } from '@/auth/AuthProvider';
import { useAppTheme } from '@/theme/theme';

export default function ConsumptionFormScreen() {
  const { token, loading } = useAuth();
  const params = useLocalSearchParams<{ mosqueId?: string }>();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const reference = useQuery({ queryKey: ['reference'], queryFn: api.reference, enabled: !!token });
  const [category, setCategory] = useState('building_materials');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [progressPercent, setProgressPercent] = useState('');
  const [files, setFiles] = useState<PickedUpload[]>([]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!params.mosqueId) throw new Error('افتح الإضافة من صفحة المسجد');
      const media = [];
      for (const file of files) {
        const signed = await api.signUpload({ mimeType: file.mimeType, originalFilename: file.name, folder: `mosques/${params.mosqueId}/consumption`, fileSize: file.size });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        media.push({ fileKind: file.kind, mediaType: media.length === 0 ? 'cheque_image' : 'invoice', storageKey: signed.storageKey, mimeType: file.mimeType, fileSize: file.size, autoTitle: `استهلاك - ${file.name}` });
      }
      await apiFetch('/consumption', {
        method: 'POST',
        body: {
          mosqueId: params.mosqueId,
          consumptionCategoryCode: category,
          withdrawnAmount: amount ? Number(amount) : undefined,
          optionalProgressPercent: progressPercent ? Number(progressPercent) : undefined,
          shortNote: note,
          media,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['consumption', params.mosqueId] });
      router.replace(`/mosques/${params.mosqueId}`);
    },
    onError: (error) => Alert.alert('تعذر الحفظ', error instanceof Error ? error.message : 'خطأ غير معروف'),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  return (
    <Screen>
      <View>
        <AppText variant="title">إضافة استهلاك</AppText>
        <AppText color={colors.muted}>يفضل رفع صورة الصك والفواتير أو الإثباتات</AppText>
      </View>
      <AppCard style={styles.form}>
        <AppText variant="caption" color={colors.muted}>التصنيف</AppText>
        <FilterChips chips={(reference.data?.categories ?? []).map((c) => ({ key: c.code, label: c.labelAr }))} value={category} onChange={setCategory} />
        <ThemedInput label="المبلغ المسحوب" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <ThemedInput label="نسبة تقدم اختيارية" keyboardType="numeric" value={progressPercent} onChangeText={setProgressPercent} />
        <ThemedInput label="شرح قصير" value={note} onChangeText={setNote} multiline />
      </AppCard>
      <UploadPicker value={files} onChange={setFiles} />
      <ThemedButton title="حفظ الاستهلاك" icon={Save} disabled={mutation.isPending} onPress={() => mutation.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
