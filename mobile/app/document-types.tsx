import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { apiFetch } from '@/api/client';
import { api } from '@/api/queries';
import { useAuth } from '@/auth/AuthProvider';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { AnimatedModal, BottomSheet, ToastMessages, useToast } from '@/components/ui';
import { FloppyDisk, ListPlus, Plus, Trash } from '@/components/ui/icons';
import { useAppTheme } from '@/theme/theme';
import type { DocumentType } from '@/types/api';

const groups = [
  { key: 'mosque_file', label: 'ملف المسجد' },
  { key: 'association_file', label: 'ملف الجمعية' },
  { key: 'technical', label: 'تقنية' },
  { key: 'financial', label: 'مالية' },
  { key: 'consumption', label: 'استهلاك' },
  { key: 'progression', label: 'تقدم' },
  { key: 'other', label: 'أخرى' },
];

const retentionPolicies = [
  { key: 'keep_all_versions', label: 'حفظ كل النسخ' },
  { key: 'archive_old_versions', label: 'أرشفة القديم' },
  { key: 'replace_after_confirmation', label: 'استبدال بتأكيد' },
  { key: 'temporary_delete_after_days', label: 'حذف مؤقت' },
];

export default function DocumentTypesScreen() {
  const { token, loading, user } = useAuth();
  const { colors } = useAppTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [manageOpen, setManageOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentType | null>(null);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({
    labelAr: '',
    code: '',
    group: 'other',
    supportsExpiration: 'false',
    isRequiredDefault: 'false',
    retentionPolicy: 'replace_after_confirmation',
  });
  const types = useQuery({ queryKey: ['document-types'], queryFn: api.documentTypes, enabled: !!token });

  useEffect(() => {
    if (editing) {
      setForm({
        labelAr: editing.labelAr,
        code: editing.code,
        group: editing.group,
        supportsExpiration: String(editing.supportsExpiration),
        isRequiredDefault: String(editing.isRequiredDefault),
        retentionPolicy: editing.retentionPolicy || 'replace_after_confirmation',
      });
      setFormOpen(true);
    }
  }, [editing]);

  const filtered = useMemo(() => {
    const normalized = q.trim().toLocaleLowerCase('ar-DZ');
    return (types.data ?? []).filter((type) => {
      if (!normalized) return true;
      return type.labelAr.toLocaleLowerCase('ar-DZ').includes(normalized) || type.code.toLocaleLowerCase().includes(normalized);
    });
  }, [q, types.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!form.labelAr.trim()) throw new Error('التسمية العربية مطلوبة');
      if (!form.group) throw new Error('المجموعة مطلوبة');
      const body = {
        labelAr: form.labelAr.trim(),
        code: normalizeCode(form.code || form.labelAr),
        group: form.group,
        supportsExpiration: form.supportsExpiration === 'true',
        isRequiredDefault: form.isRequiredDefault === 'true',
        retentionPolicy: form.retentionPolicy,
      };
      return apiFetch(editing ? `/document-types/${editing.id}` : '/document-types', {
        method: editing ? 'PATCH' : 'POST',
        body,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['document-types'] });
      closeForm();
      toast.success(ToastMessages.saveSuccess);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/document-types/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['document-types'] });
      toast.success(ToastMessages.deleteSuccess);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.deleteError),
  });

  if (!loading && !token) return <Redirect href="/login" />;

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <Screen>
      <View>
        <AppText variant="title">أنواع الوثائق</AppText>
        <AppText color={colors.muted}>إدارة الأنواع بدون عرض قائمة ضخمة إلا عند الحاجة.</AppText>
      </View>
      {canManage ? (
        <View style={styles.actions}>
          <ThemedButton title="إضافة نوع جديد" icon={Plus} onPress={() => setFormOpen(true)} />
          <ThemedButton title="عرض وإدارة كل الأنواع" icon={ListPlus} tone="neutral" onPress={() => setManageOpen(true)} />
        </View>
      ) : null}

      <AppCard style={styles.item}>
        <AppText variant="subtitle">ملخص</AppText>
        <AppText color={colors.textSecondary}>عدد الأنواع النشطة: {types.data?.length ?? 0}</AppText>
      </AppCard>

      {manageOpen ? (
        <View style={styles.list}>
          <SearchBar value={q} onChangeText={setQ} placeholder="ابحث في الأنواع" />
          {filtered.map((type) => (
            <AppCard key={type.id} style={styles.item}>
              <View style={styles.itemHead}>
                <Pressable onPress={() => setEditing(type)} style={styles.typeText}>
                  <AppText variant="subtitle">{type.labelAr}</AppText>
                  <AppText variant="caption" color={colors.muted}>{type.code} - {type.group}</AppText>
                </Pressable>
                <Pressable onPress={() => setDeleteTarget(type)} style={styles.iconButton}>
                  <Trash size={18} color={colors.danger} weight="duotone" />
                </Pressable>
              </View>
              <AppText variant="caption" color={type.supportsExpiration ? colors.warning : colors.info}>
                {type.supportsExpiration ? 'يدعم الصلاحية' : 'بدون صلاحية'} - {type.retentionPolicy}
              </AppText>
            </AppCard>
          ))}
        </View>
      ) : null}

      <BottomSheet visible={formOpen} onClose={closeForm} snapPoints={['68%', '92%']}>
        <View style={styles.form}>
          <AppText variant="subtitle">{editing ? 'تعديل نوع الوثيقة' : 'إضافة نوع جديد'}</AppText>
          <ThemedInput label="التسمية بالعربية" value={form.labelAr} onChangeText={(labelAr) => setForm((current) => ({ ...current, labelAr }))} />
          <ThemedInput label="الكود الداخلي" value={form.code} onChangeText={(code) => setForm((current) => ({ ...current, code }))} placeholder="مثال: building_license" />
          <AppText variant="caption" color={colors.muted}>المجموعة</AppText>
          <FilterChips chips={groups} value={form.group} onChange={(group) => setForm((current) => ({ ...current, group }))} />
          <FilterChips
            chips={[
              { key: 'false', label: 'بدون انتهاء' },
              { key: 'true', label: 'يدعم الانتهاء' },
            ]}
            value={form.supportsExpiration}
            onChange={(supportsExpiration) => setForm((current) => ({ ...current, supportsExpiration }))}
          />
          <FilterChips
            chips={[
              { key: 'false', label: 'غير مطلوب افتراضيًا' },
              { key: 'true', label: 'مطلوب افتراضيًا' },
            ]}
            value={form.isRequiredDefault}
            onChange={(isRequiredDefault) => setForm((current) => ({ ...current, isRequiredDefault }))}
          />
          <AppText variant="caption" color={colors.muted}>سياسة الاحتفاظ</AppText>
          <FilterChips chips={retentionPolicies} value={form.retentionPolicy} onChange={(retentionPolicy) => setForm((current) => ({ ...current, retentionPolicy }))} />
          <ThemedButton title={editing ? 'حفظ التعديل' : 'إضافة النوع'} icon={FloppyDisk} disabled={saveMutation.isPending} loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
        </View>
      </BottomSheet>

      <AnimatedModal
        visible={Boolean(deleteTarget)}
        danger
        title="حذف نوع الوثيقة؟"
        message="سيتم تعطيل النوع ولن يظهر في النماذج الجديدة."
        confirmLabel="حذف"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Screen>
  );

  function closeForm() {
    setEditing(null);
    setFormOpen(false);
    setForm({
      labelAr: '',
      code: '',
      group: 'other',
      supportsExpiration: 'false',
      isRequiredDefault: 'false',
      retentionPolicy: 'replace_after_confirmation',
    });
  }
}

function normalizeCode(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  list: {
    gap: 10,
  },
  form: {
    gap: 12,
  },
  item: {
    gap: 6,
  },
  itemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  typeText: {
    flex: 1,
    gap: 3,
  },
  iconButton: {
    padding: 8,
  },
});
