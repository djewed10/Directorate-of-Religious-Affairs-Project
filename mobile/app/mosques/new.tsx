import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { useAuth } from '@/auth/AuthProvider';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { UploadPicker, type PickedUpload } from '@/components/UploadPicker';
import { BottomSheet, StorageImage, ToastMessages, useToast } from '@/components/ui';
import { Camera, FloppyDisk, Mosque as MosqueIcon, Trash } from '@/components/ui/icons';
import { scanImageForOcr } from '@/ocr/ocrService';
import { useAppTheme } from '@/theme/theme';
import { isValidGoogleMapsUrl, openGoogleMapsUrl } from '@/utils/maps';
import { buildUploadFilename, uploadDateStamp, uploadExtension } from '@/utils/uploadNames';

const allowedAddStatuses = ['under_construction', 'completed', 'renovation', 'neighborhood_no_friday'];

const schema = z.object({
  officialCode: z.string().min(2, 'يرجى إدخال الرقم الرسمي'),
  name: z.string().min(2, 'يرجى إدخال اسم المسجد'),
  commune: z.string().min(2, 'يرجى إدخال البلدية'),
  daira: z.string().optional(),
  address: z.string().optional(),
  addressText: z.string().optional(),
  googleMapsUrl: z.string().optional().refine((value) => isValidGoogleMapsUrl(value), 'رابط خرائط Google غير صالح'),
  mosqueStatus: z.string(),
  receivesFridayDonations: z.boolean(),
  currentProgressPercent: z.string().optional(),
  estimatedTotalProjectCost: z.string().optional(),
  estimatedCompletionCost: z.string().optional(),
});

type MosqueForm = z.infer<typeof schema>;

export default function MosqueFormScreen() {
  const { token, loading } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useAppTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [coverFiles, setCoverFiles] = useState<PickedUpload[]>([]);
  const [coverImageStorageKey, setCoverImageStorageKey] = useState<string | null | undefined>(undefined);
  const [ocrCandidates, setOcrCandidates] = useState<{ codes: string[]; dates: string[] } | null>(null);

  const reference = useQuery({ queryKey: ['reference'], queryFn: api.reference, enabled: !!token });
  const existing = useQuery({
    queryKey: ['mosque-edit', params.id],
    queryFn: () => api.mosque(params.id!) as Promise<any>,
    enabled: !!params.id && !!token,
  });
  const { control, handleSubmit, setValue, watch, reset, getValues, formState } = useForm<MosqueForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      officialCode: '',
      name: '',
      commune: '',
      daira: '',
      address: '',
      addressText: '',
      googleMapsUrl: '',
      mosqueStatus: 'under_construction',
      receivesFridayDonations: true,
      currentProgressPercent: '',
      estimatedTotalProjectCost: '',
      estimatedCompletionCost: '',
    },
  });

  useEffect(() => {
    if (existing.data?.mosque && getValues('officialCode') === '') {
      reset({
        officialCode: existing.data.mosque.officialCode,
        name: existing.data.mosque.name,
        commune: existing.data.mosque.commune,
        daira: existing.data.mosque.daira ?? '',
        address: existing.data.mosque.address ?? '',
        addressText: existing.data.mosque.addressText ?? '',
        googleMapsUrl: existing.data.mosque.googleMapsUrl ?? '',
        mosqueStatus: existing.data.mosque.mosqueStatus,
        receivesFridayDonations: existing.data.mosque.receivesFridayDonations,
        currentProgressPercent: String(existing.data.mosque.currentProgressPercent ?? ''),
        estimatedTotalProjectCost: String(existing.data.mosque.estimatedTotalProjectCost ?? ''),
        estimatedCompletionCost: String(existing.data.mosque.estimatedCompletionCost ?? ''),
      });
      setCoverImageStorageKey(existing.data.mosque.coverImageStorageKey ?? null);
    }
  }, [existing.data, getValues, reset]);

  const status = watch('mosqueStatus');
  const showProjectFields = status === 'under_construction' || status === 'renovation';
  const statuses = useMemo(() => {
    const source =
      reference.data?.statuses.map((item) => ({ key: item.code, label: item.labelAr })) ?? [
        { key: 'under_construction', label: 'قيد البناء' },
        { key: 'completed', label: 'مكتمل' },
        { key: 'renovation', label: 'قيد الترميم' },
        { key: 'neighborhood_no_friday', label: 'مسجد جواري لا تقام فيه الجمعة' },
      ];
    return params.id ? source : source.filter((item) => allowedAddStatuses.includes(item.key));
  }, [params.id, reference.data?.statuses]);

  const mutation = useMutation({
    mutationFn: async (values: MosqueForm) => {
      let nextCoverKey = coverImageStorageKey;
      if (coverFiles[0]) {
        const file = coverFiles[0];
        if (!file.mimeType.startsWith('image/')) throw new Error('يرجى اختيار صورة للمسجد');
        const generatedFilename = buildUploadFilename(['mosque', values.officialCode, 'cover', uploadDateStamp()], uploadExtension(file, 'jpg'));
        const signed = await api.signUpload({
          mimeType: file.mimeType,
          originalFilename: generatedFilename,
          folder: `mosques/${params.id ?? 'new'}/cover`,
          fileSize: file.size,
        });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        nextCoverKey = signed.storageKey;
      }

      return apiFetch(params.id ? `/mosques/${params.id}` : '/mosques', {
        method: params.id ? 'PATCH' : 'POST',
        body: {
          officialCode: values.officialCode,
          name: values.name,
          commune: values.commune,
          daira: values.daira || undefined,
          wilaya: 'وهران',
          address: values.address || undefined,
          addressText: values.addressText || (params.id ? null : undefined),
          googleMapsUrl: values.googleMapsUrl || (params.id ? null : undefined),
          mosqueStatus: values.mosqueStatus,
          receivesFridayDonations: values.receivesFridayDonations,
          currentProgressPercent: showProjectFields && values.currentProgressPercent ? Number(values.currentProgressPercent) : undefined,
          estimatedTotalProjectCost: showProjectFields && values.estimatedTotalProjectCost ? Number(values.estimatedTotalProjectCost) : undefined,
          estimatedCompletionCost: showProjectFields && values.estimatedCompletionCost ? Number(values.estimatedCompletionCost) : undefined,
          coverImageStorageKey: nextCoverKey === undefined ? undefined : nextCoverKey,
        },
      });
    },
    onSuccess: async (created: any) => {
      await queryClient.invalidateQueries({ queryKey: ['mosques'] });
      await queryClient.invalidateQueries({ queryKey: ['mosque', params.id ?? created.id] });
      toast.success(ToastMessages.saveSuccess);
      router.replace(`/mosques/${params.id ?? created.id}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  async function runOcr() {
    try {
      const result = await scanImageForOcr(reference.data?.ocrConfig?.officialCodeRegex);
      if (!result?.officialCodeCandidates.length && !result?.expirationDateCandidates.length) {
        toast.info('ميزة استخراج النص غير متاحة في هذه النسخة، يمكنك إدخال الرقم يدويًا');
        return;
      }
      setOcrCandidates({ codes: result.officialCodeCandidates, dates: result.expirationDateCandidates });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر استخراج النص من الصورة');
    }
  }

  function submit(values: MosqueForm) {
    if (!showProjectFields) {
      setValue('currentProgressPercent', '');
      setValue('estimatedTotalProjectCost', '');
      setValue('estimatedCompletionCost', '');
    }
    mutation.mutate(values);
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View>
          <AppText variant="title">{params.id ? 'تعديل مسجد' : 'إضافة مسجد'}</AppText>
          <AppText color={colors.muted}>الولاية ثابتة على وهران، والحقول المالية تظهر فقط للحالات التي تحتاج متابعة مشروع.</AppText>
        </View>

        <FormSection title="معلومات أساسية">
          <Controller
            control={control}
            name="officialCode"
            render={({ field, fieldState }) => (
              <ThemedInput
                label="الرقم الرسمي"
                value={field.value}
                onChangeText={field.onChange}
                icon={Camera}
                onIconPress={runOcr}
                placeholder="مثال: 2026-001"
                error={fieldState.error?.message}
                returnKeyType="next"
              />
            )}
          />
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <ThemedInput label="اسم المسجد" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} returnKeyType="next" />
            )}
          />
        </FormSection>

        <FormSection title="الموقع">
          <AutocompleteField control={control} name="commune" label="البلدية" field="commune" />
          <View style={styles.readOnly}>
            <AppText variant="caption" color={colors.textSecondary}>الولاية</AppText>
            <AppText variant="subtitle">وهران</AppText>
          </View>
          <AutocompleteField control={control} name="daira" label="الدائرة" field="daira" optional />
          <AutocompleteField control={control} name="address" label="العنوان" field="address" optional />
          <Controller
            control={control}
            name="addressText"
            render={({ field, fieldState }) => (
              <ThemedInput
                label="العنوان النصي"
                placeholder="مثال: حي خميستي، بلدية السانية"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
                returnKeyType="next"
              />
            )}
          />
          <Controller
            control={control}
            name="googleMapsUrl"
            render={({ field, fieldState }) => (
              <View style={styles.locationLink}>
                <ThemedInput
                  label="رابط Google Maps"
                  placeholder="الصق رابط الموقع من خرائط Google"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  autoCapitalize="none"
                  keyboardType="url"
                  error={fieldState.error?.message}
                  returnKeyType="next"
                />
                {field.value ? (
                  <ThemedButton title="فتح في خرائط Google" tone="neutral" onPress={() => field.value && openGoogleMapsUrl(field.value, toast.error)} />
                ) : null}
              </View>
            )}
          />
        </FormSection>

        <FormSection title="الحالة">
          <FilterChips
            chips={statuses}
            value={status}
            onChange={(nextStatus) => {
              setValue('mosqueStatus', nextStatus);
              const defaultFriday = reference.data?.statuses.find((item) => item.code === nextStatus)?.receivesFridayDonationsDefault;
              if (defaultFriday !== undefined) setValue('receivesFridayDonations', defaultFriday);
            }}
          />
          <FilterChips
            chips={[
              { key: 'true', label: 'يستفيد من الجمعة' },
              { key: 'false', label: 'لا يستفيد من الجمعة' },
            ]}
            value={String(watch('receivesFridayDonations'))}
            onChange={(value) => setValue('receivesFridayDonations', value === 'true')}
          />
        </FormSection>

        {showProjectFields ? (
          <FormSection title="التكاليف والتقدم">
            <View style={styles.row}>
              <Controller control={control} name="currentProgressPercent" render={({ field }) => <ThemedInput label="نسبة التقدم %" keyboardType="numeric" value={String(field.value ?? '')} onChangeText={field.onChange} returnKeyType="next" />} />
              <Controller control={control} name="estimatedCompletionCost" render={({ field }) => <ThemedInput label="تكلفة الإكمال" keyboardType="numeric" value={String(field.value ?? '')} onChangeText={field.onChange} returnKeyType="next" />} />
            </View>
            <Controller control={control} name="estimatedTotalProjectCost" render={({ field }) => <ThemedInput label="التكلفة الإجمالية المقدرة" keyboardType="numeric" value={String(field.value ?? '')} onChangeText={field.onChange} returnKeyType="done" onSubmitEditing={handleSubmit(submit)} />} />
          </FormSection>
        ) : null}

        <FormSection title="صورة المسجد">
          {coverImageStorageKey && !coverFiles.length ? (
            <View style={styles.coverRow}>
              <StorageImage storageKey={coverImageStorageKey} style={styles.coverPreview} fallback={<MosqueIcon color={colors.primary} size={48} weight="duotone" />} />
              <ThemedButton title="حذف الصورة" icon={Trash} tone="danger" onPress={() => setCoverImageStorageKey(null)} />
            </View>
          ) : null}
          <UploadPicker value={coverFiles} onChange={(files) => setCoverFiles(files.filter((file) => file.mimeType.startsWith('image/')).slice(0, 1))} compact imageOnly />
        </FormSection>

        <ThemedButton
          title="حفظ"
          icon={FloppyDisk}
          disabled={formState.isSubmitting || mutation.isPending}
          loading={formState.isSubmitting || mutation.isPending}
          onPress={handleSubmit(submit)}
        />
      </KeyboardAvoidingView>

      <BottomSheet visible={Boolean(ocrCandidates)} onClose={() => setOcrCandidates(null)} snapPoints={['42%', '70%']}>
        <AppText variant="subtitle">تأكيد نتيجة OCR</AppText>
        {ocrCandidates?.codes.map((code) => (
          <Pressable
            key={code}
            onPress={() => {
              setValue('officialCode', code);
              setOcrCandidates(null);
            }}
            style={[styles.candidate, { borderColor: colors.border }]}
          >
            <AppText variant="subtitle">{code}</AppText>
            <AppText variant="caption" color={colors.textMuted}>اضغط لاستعمال هذا الرقم</AppText>
          </Pressable>
        ))}
        {ocrCandidates?.dates.length ? (
          <AppText variant="caption" color={colors.textMuted}>
            تواريخ مستخرجة: {ocrCandidates.dates.join('، ')}
          </AppText>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AppCard style={styles.section}>
      <AppText variant="subtitle">{title}</AppText>
      {children}
    </AppCard>
  );
}

function AutocompleteField({
  control,
  name,
  label,
  field,
  optional,
}: {
  control: ReturnType<typeof useForm<MosqueForm>>['control'];
  name: keyof MosqueForm;
  label: string;
  field: string;
  optional?: boolean;
}) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const suggestions = useQuery({
    queryKey: ['suggestions', field, query],
    queryFn: () => api.suggestions(field, query),
    enabled: open && query.length > 0,
  });
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: inputField, fieldState }) => (
        <View style={styles.autocomplete}>
          <ThemedInput
            label={label}
            value={String(inputField.value ?? '')}
            onFocus={() => setOpen(true)}
            onChangeText={(text) => {
              inputField.onChange(text);
              setQuery(text);
              setOpen(true);
            }}
            error={!optional ? fieldState.error?.message : undefined}
            returnKeyType="next"
          />
          {open && suggestions.data?.length ? (
            <AppCard style={styles.suggestions}>
              {suggestions.data.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    inputField.onChange(item);
                    setQuery(item);
                    setOpen(false);
                  }}
                  style={styles.suggestionRow}
                >
                  <AppText color={colors.textSecondary}>{item}</AppText>
                </Pressable>
              ))}
            </AppCard>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  keyboard: {
    gap: 14,
  },
  section: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  readOnly: {
    gap: 4,
  },
  locationLink: {
    gap: 8,
  },
  pick: {
    gap: 4,
    shadowOpacity: 0,
    elevation: 0,
  },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  coverPreview: {
    width: 128,
    height: 92,
    borderRadius: 14,
  },
  candidate: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  autocomplete: {
    zIndex: 10,
  },
  suggestions: {
    gap: 2,
    shadowOpacity: 0,
    elevation: 0,
  },
  suggestionRow: {
    paddingVertical: 9,
  },
});
