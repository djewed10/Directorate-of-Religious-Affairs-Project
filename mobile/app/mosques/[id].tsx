import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { apiFetch, uploadToSignedUrl } from '@/api/client';
import { api } from '@/api/queries';
import { useAuth } from '@/auth/AuthProvider';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { DatePickerField } from '@/components/DatePickerField';
import { DocumentBadge } from '@/components/DocumentBadge';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import {
  AnimatedModal,
  BottomSheet,
  FileActionRow,
  ImageViewer,
  MediaThumbStrip,
  StorageImage,
  ToastMessages,
  openStorageFile,
  printStorageFile,
  shareStorageFile,
  useToast,
} from '@/components/ui';
import { UploadPicker, type PickedUpload } from '@/components/UploadPicker';
import { ArrowLeft, FilePlus, FloppyDisk, HandCoins, Link, Mosque as MosqueIcon, Printer, ShareNetwork, Trash, TrendUp } from '@/components/ui/icons';
import { useAppTheme } from '@/theme/theme';
import type { DocumentRow, Mosque, TimelineMedia } from '@/types/api';
import { dateAr, money } from '@/utils/format';
import { buildUploadFilename, uploadDateStamp, uploadExtension } from '@/utils/uploadNames';

const sections = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'documents', label: 'الوثائق' },
  { key: 'progression', label: 'التقدم' },
  { key: 'consumption', label: 'الاستهلاك' },
  { key: 'aids', label: 'الاستفادات' },
  { key: 'notes', label: 'الملاحظات' },
  { key: 'settings', label: 'المعلومات' },
];

type DetailResponse = {
  mosque: Mosque;
  association?: { id?: string; name: string } | null;
  documentSummary?: { total: number; expired: number; expiringSoon: number; noExpiration: number };
};

type ProgressionEntry = {
  id: string;
  mosqueId: string;
  stageCode?: string | null;
  progressPercent?: number | null;
  shortNote?: string | null;
  createdAt: string;
  media?: TimelineMedia[];
};

type ConsumptionEntry = {
  id: string;
  mosqueId: string;
  aidRecordId?: string | null;
  withdrawnAmount?: number | null;
  optionalProgressPercent?: number | null;
  shortNote?: string | null;
  createdAt: string;
  hasCheque?: boolean;
  media?: TimelineMedia[];
};

type AidEntry = {
  id: string;
  mosqueId: string;
  amount: number;
  aidDate: string;
  sourceType?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  attachmentStorageKey?: string | null;
  attachmentMimeType?: string | null;
  attachmentFileSize?: number | null;
  attachmentOriginalFilename?: string | null;
};

type NoteEntry = {
  id: string;
  mosqueId: string;
  content: string;
  templateCode?: string | null;
  createdAt: string;
};

type DeleteTarget =
  | { type: 'mosque'; id: string }
  | { type: 'document'; id: string }
  | { type: 'progression'; id: string }
  | { type: 'consumption'; id: string }
  | { type: 'aid'; id: string }
  | { type: 'note'; id: string }
  | { type: 'progressionMedia'; id: string }
  | { type: 'consumptionMedia'; id: string };

type ViewerMedia = {
  id?: string;
  storageKey: string;
  mimeType?: string | null;
  autoTitle?: string | null;
  originalFilename?: string | null;
};

const deleteCopy: Record<DeleteTarget['type'], { title: string; message: string }> = {
  mosque: {
    title: 'حذف المسجد؟',
    message: 'سيتم حذف المسجد من الواجهة وتعطيل بياناته المرتبطة حسب سياسة النظام.',
  },
  document: {
    title: 'حذف الوثيقة؟',
    message: 'سيتم أرشفة الوثيقة وحذفها من المحفظة الحالية دون حذف الملف نهائيًا.',
  },
  progression: {
    title: 'حذف تحديث التقدم؟',
    message: 'سيتم حذف تحديث التقدم وإخفاء صوره المرتبطة من هذا السجل.',
  },
  consumption: {
    title: 'حذف الاستهلاك؟',
    message: 'سيتم حذف سجل الاستهلاك وتحديث إجمالي الاستهلاك للمسجد.',
  },
  aid: {
    title: 'حذف الاستفادة؟',
    message: 'سيتم حذف سجل الاستفادة وتحديث العدد والإجمالي وآخر استفادة.',
  },
  note: {
    title: 'حذف الملاحظة؟',
    message: 'سيتم حذف الملاحظة الداخلية من سجل المسجد.',
  },
  progressionMedia: {
    title: 'حذف ملف التقدم؟',
    message: 'سيتم حذف هذا الملف من تحديث التقدم.',
  },
  consumptionMedia: {
    title: 'حذف ملف الاستهلاك؟',
    message: 'سيتم حذف هذا الملف من سجل الاستهلاك.',
  },
};

export default function MosqueDetailScreen() {
  const { token, loading } = useAuth();
  const params = useLocalSearchParams<{
    id: string;
    section?: string;
    documentId?: string;
    progressionId?: string;
    consumptionId?: string;
    aidId?: string;
    noteId?: string;
  }>();
  const id = params.id;
  const { colors } = useAppTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [section, setSection] = useState(params.section ?? 'overview');
  const [selectedDocument, setSelectedDocument] = useState<DocumentRow | null>(null);
  const [selectedProgression, setSelectedProgression] = useState<ProgressionEntry | null>(null);
  const [selectedConsumption, setSelectedConsumption] = useState<ConsumptionEntry | null>(null);
  const [selectedAid, setSelectedAid] = useState<AidEntry | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteEntry | null>(null);
  const [viewerMedia, setViewerMedia] = useState<ViewerMedia | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [newNote, setNewNote] = useState('');
  const [documentsPage, setDocumentsPage] = useState(1);
  const [progressionPage, setProgressionPage] = useState(1);
  const [consumptionPage, setConsumptionPage] = useState(1);
  const [aidsPage, setAidsPage] = useState(1);
  const [documentRows, setDocumentRows] = useState<DocumentRow[]>([]);
  const [progressionRows, setProgressionRows] = useState<ProgressionEntry[]>([]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionEntry[]>([]);
  const [aidRows, setAidRows] = useState<AidEntry[]>([]);
  const [coverImageFiles, setCoverImageFiles] = useState<PickedUpload[]>([]);

  const detail = useQuery({ queryKey: ['mosque', id], queryFn: () => api.mosque(id) as Promise<DetailResponse>, enabled: !!id && !!token });
  const documents = useQuery({ queryKey: ['documents', id, documentsPage], queryFn: () => apiFetch<DocumentRow[]>('/documents', { query: { mosqueId: id, page: documentsPage, limit: 20 } }), enabled: !!id && !!token });
  const progression = useQuery({ queryKey: ['progression', id, progressionPage], queryFn: () => apiFetch<ProgressionEntry[]>('/progression', { query: { mosqueId: id, page: progressionPage, limit: 20 } }), enabled: !!id && !!token });
  const consumption = useQuery({ queryKey: ['consumption', id, consumptionPage], queryFn: () => apiFetch<ConsumptionEntry[]>('/consumption', { query: { mosqueId: id, page: consumptionPage, limit: 20 } }), enabled: !!id && !!token });
  const aids = useQuery({ queryKey: ['aids', id, aidsPage], queryFn: () => apiFetch<AidEntry[]>('/aid-records', { query: { mosqueId: id, page: aidsPage, limit: 20 } }), enabled: !!id && !!token });
  const notes = useQuery({ queryKey: ['notes', id], queryFn: () => apiFetch<NoteEntry[]>('/internal-notes', { query: { mosqueId: id, limit: 30 } }), enabled: !!id && !!token });

  const deleteMutation = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      const path =
        target.type === 'document'
          ? `/documents/${target.id}`
          : target.type === 'mosque'
            ? `/mosques/${target.id}`
            : target.type === 'progression'
              ? `/progression/${target.id}`
              : target.type === 'consumption'
                ? `/consumption/${target.id}`
          : target.type === 'aid'
                ? `/aid-records/${target.id}`
                : target.type === 'progressionMedia'
                  ? `/progression/media/${target.id}`
                  : target.type === 'consumptionMedia'
                    ? `/consumption/media/${target.id}`
                    : `/internal-notes/${target.id}`;
      return apiFetch(path, { method: 'DELETE' });
    },
    onSuccess: async (_payload, target) => {
      setDeleteTarget(null);
      setSelectedDocument(null);
      setSelectedProgression(null);
      setSelectedConsumption(null);
      setSelectedAid(null);
      setSelectedNote(null);
      if (target.type === 'mosque') {
        await queryClient.invalidateQueries({ queryKey: ['mosques'] });
        toast.success(ToastMessages.deleteSuccess);
        router.replace('/mosques');
        return;
      }
      await invalidateDetailQueries(queryClient, id);
      toast.success(ToastMessages.deleteSuccess);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.deleteError),
  });
  const createNoteMutation = useMutation({
    mutationFn: () => {
      if (!newNote.trim()) throw new Error('يرجى إدخال الملاحظة');
      return apiFetch('/internal-notes', { method: 'POST', body: { mosqueId: id, content: newNote.trim() } });
    },
    onSuccess: async () => {
      setNewNote('');
      await queryClient.invalidateQueries({ queryKey: ['notes', id] });
      toast.success(ToastMessages.saveSuccess);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  const updateCoverImageMutation = useMutation({
    mutationFn: async () => {
      const file = coverImageFiles[0];
      if (!file) throw new Error('يرجى اختيار صورة');
      if (!file.mimeType?.startsWith('image/')) throw new Error('يرجى اختيار صورة صحيحة (JPG, PNG, WebP)');
      const generatedFilename = buildUploadFilename(['mosque', detail.data?.mosque?.officialCode ?? id, 'cover', uploadDateStamp()], uploadExtension(file, 'jpg'));
      const signed = await api.signUpload({
        mimeType: file.mimeType,
        originalFilename: generatedFilename,
        folder: `mosques/${id}/cover`,
        fileSize: file.size,
      });
      await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
      return apiFetch(`/mosques/${id}`, { method: 'PATCH', body: { coverImageStorageKey: signed.storageKey } });
    },
    onSuccess: async () => {
      setCoverImageFiles([]);
      await queryClient.invalidateQueries({ queryKey: ['mosque', id] });
      toast.success('تم تحديث صورة المسجد بنجاح');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'تعذر رفع الصورة'),
  });

  const mosque = detail.data?.mosque;
  const showProjectFields = mosque?.mosqueStatus === 'under_construction' || mosque?.mosqueStatus === 'renovation';
  const openCoverImageViewer = () => {
    if (!mosque?.coverImageStorageKey) return;
    setViewerMedia({
      storageKey: mosque.coverImageStorageKey,
      mimeType: 'image/*',
      autoTitle: 'صورة المسجد',
    });
  };

  useEffect(() => {
    setDocumentRows([]);
    setProgressionRows([]);
    setConsumptionRows([]);
    setAidRows([]);
    setDocumentsPage(1);
    setProgressionPage(1);
    setConsumptionPage(1);
    setAidsPage(1);
  }, [id]);

  useEffect(() => {
    if (!documents.data) return;
    setDocumentRows((current) => (documentsPage === 1 ? documents.data : [...current, ...documents.data]));
  }, [documents.data, documentsPage]);

  useEffect(() => {
    if (!progression.data) return;
    setProgressionRows((current) => (progressionPage === 1 ? progression.data : [...current, ...progression.data]));
  }, [progression.data, progressionPage]);

  useEffect(() => {
    if (!consumption.data) return;
    setConsumptionRows((current) => (consumptionPage === 1 ? consumption.data : [...current, ...consumption.data]));
  }, [consumption.data, consumptionPage]);

  useEffect(() => {
    if (!aids.data) return;
    setAidRows((current) => (aidsPage === 1 ? aids.data : [...current, ...aids.data]));
  }, [aids.data, aidsPage]);

  useEffect(() => {
    if (params.section) setSection(params.section);
  }, [params.section]);

  useEffect(() => {
    if (params.documentId && documentRows.length) setSelectedDocument(documentRows.find((row) => row.document.id === params.documentId) ?? null);
  }, [params.documentId, documentRows]);

  useEffect(() => {
    if (params.progressionId && progressionRows.length) {
      setSelectedProgression(progressionRows.find((row) => row.id === params.progressionId) ?? null);
    }
  }, [params.progressionId, progressionRows]);

  useEffect(() => {
    if (params.consumptionId && consumptionRows.length) {
      setSelectedConsumption(consumptionRows.find((row) => row.id === params.consumptionId) ?? null);
    }
  }, [params.consumptionId, consumptionRows]);

  useEffect(() => {
    if (params.aidId && aidRows.length) {
      setSelectedAid(aidRows.find((row) => row.id === params.aidId) ?? null);
    }
  }, [params.aidId, aidRows]);

  useEffect(() => {
    if (params.noteId && notes.data?.length) {
      setSelectedNote(notes.data.find((row) => row.id === params.noteId) ?? null);
    }
  }, [params.noteId, notes.data]);

  if (!loading && !token) return <Redirect href="/login" />;
  if (detail.isLoading || !mosque) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={() => invalidateDetailQueries(queryClient, id)} refreshing={detail.isRefetching}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={colors.primary} size={22} weight="bold" />
        </Pressable>
        <Pressable onPress={openCoverImageViewer} disabled={!mosque.coverImageStorageKey}>
          <StorageImage
            storageKey={mosque.coverImageStorageKey}
            style={styles.headerImage}
            fallback={<View style={[styles.headerFallback, { backgroundColor: colors.primarySoft }]}><MosqueIcon color={colors.primary} size={26} weight="duotone" /></View>}
          />
        </Pressable>
        <View style={styles.title}>
          <AppText variant="title">{mosque.name}</AppText>
          <AppText color={colors.info}>رقم {mosque.officialCode} - بلدية {mosque.commune}</AppText>
        </View>
        <StatusBadge status={mosque.mosqueStatus} />
      </View>

      <FilterChips chips={sections} value={section} onChange={setSection} />

      {section === 'overview' ? (
        <View style={styles.overview}>
          <View style={styles.metrics}>
            {showProjectFields ? <Metric label="نسبة التقدم" value={`${mosque.currentProgressPercent ?? 0}%`} /> : null}
            {showProjectFields ? <Metric label="تكلفة الإكمال" value={`${money(mosque.estimatedCompletionCost)} دج`} /> : null}
            <Metric label="إجمالي الاستفادات" value={`${money(mosque.totalAidAmount)} دج`} />
            <Metric label="إجمالي الاستهلاك" value={`${money(mosque.totalConsumedAmount)} دج`} />
          </View>
          <AppCard style={styles.card}>
            <AppText variant="subtitle">هوية المسجد</AppText>
            <Info label="الجمعية" value={detail.data?.association?.name ?? 'غير محددة'} />
            <Info label="تبرعات الجمعة" value={mosque.receivesFridayDonations ? 'نعم' : 'لا'} />
            <Info label="آخر استفادة" value={dateAr(mosque.lastAidDate)} />
            <Info label="عدد مرات الاستفادة" value={String(mosque.aidCount)} />
          </AppCard>
          <AppCard style={styles.card}>
            <AppText variant="subtitle">حالة الوثائق</AppText>
            <Info label="المجموع" value={String(detail.data?.documentSummary?.total ?? 0)} />
            <Info label="منتهية" value={String(detail.data?.documentSummary?.expired ?? 0)} tone={colors.danger} />
            <Info label="ستنتهي قريبًا" value={String(detail.data?.documentSummary?.expiringSoon ?? 0)} tone={colors.warning} />
            <Info label="بدون صلاحية" value={String(detail.data?.documentSummary?.noExpiration ?? 0)} tone={colors.info} />
          </AppCard>
          <View style={styles.actions}>
            <ThemedButton title="إضافة وثيقة" icon={FilePlus} onPress={() => router.push({ pathname: '/documents/new', params: { mosqueId: id } })} />
            <ThemedButton title="إضافة استفادة" icon={HandCoins} tone="neutral" onPress={() => router.push({ pathname: '/aids/new', params: { mosqueId: id } })} />
            <ThemedButton title="طلب تحديث" icon={Link} tone="neutral" onPress={() => router.push({ pathname: '/requests/new', params: { mosqueId: id } })} />
            <ThemedButton title="ملخص للطباعة" icon={Printer} tone="neutral" onPress={() => router.push(`/print/${id}`)} />
          </View>
        </View>
      ) : null}

      {section === 'documents' ? (
        <View style={styles.list}>
          {documentRows.length ? documentRows.map((row) => (
            <DocumentCard key={row.document.id} row={row} highlighted={params.documentId === row.document.id} onPress={() => setSelectedDocument(row)} />
          )) : <EmptyState title="لا توجد وثائق" />}
          {(documents.data?.length ?? 0) === 20 ? (
            <ThemedButton title="تحميل المزيد" tone="neutral" loading={documents.isFetching && documentsPage > 1} onPress={() => setDocumentsPage((value) => value + 1)} />
          ) : null}
        </View>
      ) : null}

      {section === 'progression' ? (
        <View style={styles.list}>
          <ThemedButton title="إضافة تقدم" icon={TrendUp} onPress={() => router.push({ pathname: '/progression/new', params: { mosqueId: id } })} />
          {progressionRows.map((item) => (
            <TimelineDetailCard
              key={item.id}
              title={item.stageCode ?? 'تحديث تقدم'}
              date={item.createdAt}
              note={item.shortNote ?? undefined}
              badge={item.progressPercent !== null && item.progressPercent !== undefined ? `${item.progressPercent}%` : undefined}
              media={item.media}
              highlighted={params.progressionId === item.id}
              onPress={() => setSelectedProgression(item)}
              onMediaPress={setViewerMedia}
            />
          ))}
          {!progressionRows.length ? <EmptyState title="لا توجد تحديثات تقدم" /> : null}
          {(progression.data?.length ?? 0) === 20 ? (
            <ThemedButton title="تحميل المزيد" tone="neutral" loading={progression.isFetching && progressionPage > 1} onPress={() => setProgressionPage((value) => value + 1)} />
          ) : null}
        </View>
      ) : null}

      {section === 'consumption' ? (
        <View style={styles.list}>
          <ThemedButton title="إضافة استهلاك" icon={FloppyDisk} onPress={() => router.push({ pathname: '/consumption/new', params: { mosqueId: id } })} />
          {consumptionRows.map((item) => (
            <TimelineDetailCard
              key={item.id}
              title={`${money(item.withdrawnAmount)} دج`}
              date={item.createdAt}
              note={item.shortNote ?? undefined}
              badge={item.hasCheque ? 'صك مرفق' : 'إثباتات'}
              media={item.media}
              highlighted={params.consumptionId === item.id}
              onPress={() => setSelectedConsumption(item)}
              onMediaPress={setViewerMedia}
            />
          ))}
          {!consumptionRows.length ? <EmptyState title="لا توجد تحديثات استهلاك" /> : null}
          {(consumption.data?.length ?? 0) === 20 ? (
            <ThemedButton title="تحميل المزيد" tone="neutral" loading={consumption.isFetching && consumptionPage > 1} onPress={() => setConsumptionPage((value) => value + 1)} />
          ) : null}
        </View>
      ) : null}

      {section === 'aids' ? (
        <View style={styles.list}>
          <ThemedButton title="إضافة استفادة" icon={HandCoins} onPress={() => router.push({ pathname: '/aids/new', params: { mosqueId: id } })} />
          {aidRows.map((item) => (
            <AppCard key={item.id} onPress={() => setSelectedAid(item)} style={[styles.card, params.aidId === item.id && { borderColor: colors.info }]}>
              <View style={styles.itemHead}>
                <View style={styles.title}>
                  <AppText variant="subtitle">{money(item.amount)} دج</AppText>
                  <AppText variant="caption" color={colors.textMuted}>{dateAr(item.aidDate)}</AppText>
                </View>
                {item.sourceType ? <StatusBadge status={item.sourceType} /> : null}
              </View>
              {item.notes ? <AppText color={colors.textSecondary}>{item.notes}</AppText> : null}
              {item.attachmentStorageKey ? (
                <FileActionRow
                  storageKey={item.attachmentStorageKey}
                  mimeType={item.attachmentMimeType}
                  title={item.attachmentOriginalFilename ?? 'مرفق الاستفادة'}
                />
              ) : null}
            </AppCard>
          ))}
          {!aidRows.length ? <EmptyState title="لا توجد استفادات" /> : null}
          {(aids.data?.length ?? 0) === 20 ? (
            <ThemedButton title="تحميل المزيد" tone="neutral" loading={aids.isFetching && aidsPage > 1} onPress={() => setAidsPage((value) => value + 1)} />
          ) : null}
        </View>
      ) : null}

      {section === 'notes' ? (
        <View style={styles.list}>
          <AppCard style={styles.card}>
            <ThemedInput label="ملاحظة جديدة" value={newNote} onChangeText={setNewNote} multiline />
            <ThemedButton title="حفظ الملاحظة" icon={FloppyDisk} disabled={createNoteMutation.isPending} loading={createNoteMutation.isPending} onPress={() => createNoteMutation.mutate()} />
          </AppCard>
          {(notes.data ?? []).map((item) => (
            <AppCard key={item.id} onPress={() => setSelectedNote(item)} style={[styles.card, params.noteId === item.id && { borderColor: colors.info }]}>
              <AppText variant="subtitle">ملاحظة داخلية</AppText>
              <AppText color={colors.textSecondary}>{item.content}</AppText>
              <AppText variant="caption" color={colors.textMuted}>{dateAr(item.createdAt)}</AppText>
            </AppCard>
          ))}
          {!notes.data?.length ? <EmptyState title="لا توجد ملاحظات داخلية" /> : null}
        </View>
      ) : null}

      {section === 'settings' ? (
        <View style={styles.settingsContainer}>
          <AppCard style={styles.card}>
            <AppText variant="subtitle">صورة المسجد</AppText>
            {mosque.coverImageStorageKey ? (
              <Pressable onPress={openCoverImageViewer}>
                <StorageImage
                  storageKey={mosque.coverImageStorageKey}
                  style={styles.coverPreview}
                  fallback={<View style={[styles.coverPreview, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}><MosqueIcon color={colors.primary} size={32} weight="duotone" /></View>}
                />
              </Pressable>
            ) : (
              <View style={[styles.coverPreview, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
                <MosqueIcon color={colors.primary} size={32} weight="duotone" />
              </View>
            )}
            <UploadPicker value={coverImageFiles} onChange={(next) => setCoverImageFiles(next.slice(0, 1))} compact imageOnly />
            {coverImageFiles.length > 0 ? (
              <View style={styles.actions}>
                <ThemedButton
                  title="تحميل الصورة"
                  icon={FloppyDisk}
                  loading={updateCoverImageMutation.isPending}
                  disabled={updateCoverImageMutation.isPending}
                  onPress={() => updateCoverImageMutation.mutate()}
                />
                <ThemedButton
                  title="إلغاء"
                  tone="neutral"
                  onPress={() => setCoverImageFiles([])}
                  disabled={updateCoverImageMutation.isPending}
                />
              </View>
            ) : null}
          </AppCard>
          <AppCard style={styles.card}>
          <AppText variant="subtitle">معلومات قابلة للتعديل من شاشة التحرير</AppText>
          <Info label="الدائرة" value={mosque.daira ?? 'غير محددة'} />
          <Info label="الولاية" value={mosque.wilaya ?? 'وهران'} />
          <Info label="العنوان" value={mosque.address ?? 'غير محدد'} />
          <ThemedButton title="تعديل بيانات المسجد" tone="neutral" onPress={() => router.push({ pathname: '/mosques/new', params: { id } })} />
          <ThemedButton title="حذف المسجد" icon={Trash} tone="danger" onPress={() => setDeleteTarget({ type: 'mosque', id })} />
        </AppCard>
        </View>
      ) : null}

      <DocumentDetailSheet row={selectedDocument} mosque={mosque} mosqueId={id} onClose={() => setSelectedDocument(null)} onDelete={(docId) => setDeleteTarget({ type: 'document', id: docId })} />
      <ProgressionDetailSheet
        item={selectedProgression}
        mosque={mosque}
        onClose={() => setSelectedProgression(null)}
        onDelete={(itemId) => setDeleteTarget({ type: 'progression', id: itemId })}
        onDeleteMedia={(mediaId) => setDeleteTarget({ type: 'progressionMedia', id: mediaId })}
              onMediaPress={(media) => setViewerMedia(media)}
      />
      <ConsumptionDetailSheet
        item={selectedConsumption}
        mosque={mosque}
        onClose={() => setSelectedConsumption(null)}
        onDelete={(itemId) => setDeleteTarget({ type: 'consumption', id: itemId })}
        onDeleteMedia={(mediaId) => setDeleteTarget({ type: 'consumptionMedia', id: mediaId })}
              onMediaPress={(media) => setViewerMedia(media)}
      />
      <AidDetailSheet item={selectedAid} mosque={mosque} onClose={() => setSelectedAid(null)} onDelete={(itemId) => setDeleteTarget({ type: 'aid', id: itemId })} />
      <NoteDetailSheet item={selectedNote} mosque={mosque} onClose={() => setSelectedNote(null)} onDelete={(itemId) => setDeleteTarget({ type: 'note', id: itemId })} />
      <ImageViewer
        media={viewerMedia}
        visible={Boolean(viewerMedia)}
        onClose={() => setViewerMedia(null)}
        onInsertDocument={() => {
          setViewerMedia(null);
          router.push({ pathname: '/documents/new', params: { mosqueId: id } });
        }}
      />

      <AnimatedModal
        visible={Boolean(deleteTarget)}
        danger
        title={deleteTarget ? deleteCopy[deleteTarget.type].title : 'تأكيد الحذف'}
        message={deleteTarget ? deleteCopy[deleteTarget.type].message : undefined}
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </Screen>
  );
}

function DocumentCard({ row, highlighted, onPress }: { row: DocumentRow; highlighted?: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <AppCard onPress={onPress} style={[styles.card, highlighted && { borderColor: colors.info }]}>
      <View style={styles.itemHead}>
        <View style={styles.title}>
          <AppText variant="subtitle">{row.type.labelAr}</AppText>
          <AppText variant="caption" color={colors.muted}>{row.document.originalFilename} - نسخة {row.document.currentVersionNumber}</AppText>
        </View>
        <DocumentBadge supportsExpiration={row.type.supportsExpiration} expirationDate={row.document.expirationDate} />
      </View>
      <FileActionRow storageKey={row.document.storageKey} mimeType={row.document.mimeType} title={row.document.originalFilename} />
    </AppCard>
  );
}

function TimelineDetailCard({
  title,
  date,
  note,
  badge,
  media,
  highlighted,
  onPress,
  onMediaPress,
}: {
  title: string;
  date: string;
  note?: string;
  badge?: string;
  media?: TimelineMedia[];
  highlighted?: boolean;
  onPress: () => void;
  onMediaPress: (media: TimelineMedia) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <AppCard onPress={onPress} style={[styles.card, highlighted && { borderColor: colors.info }]}>
      <View style={styles.itemHead}>
        <View style={styles.title}>
          <AppText variant="subtitle">{title}</AppText>
          <AppText variant="caption" color={colors.textMuted}>{dateAr(date)}</AppText>
        </View>
        {badge ? <StatusBadge status={badge} /> : null}
      </View>
      {note ? <AppText color={colors.textSecondary}>{note}</AppText> : null}
      <MediaThumbStrip media={media} onOpen={(item) => onMediaPress(item as TimelineMedia)} />
    </AppCard>
  );
}

function DocumentDetailSheet({
  row,
  mosque,
  mosqueId,
  onClose,
  onDelete,
}: {
  row: DocumentRow | null;
  mosque: Mosque;
  mosqueId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    setIssueDate(row?.document.issueDate ?? '');
    setExpirationDate(row?.document.expirationDate ?? '');
    setIsPinned(Boolean(row?.document.isPinned));
  }, [row]);

  const update = useMutation({
    mutationFn: () =>
      apiFetch(`/documents/${row?.document.id}`, {
        method: 'PATCH',
        body: {
          issueDate: issueDate || null,
          expirationDate: row?.type.supportsExpiration && expirationDate ? expirationDate : null,
          isPinned,
        },
    }),
    onSuccess: async () => {
      await invalidateDetailQueries(queryClient, mosqueId);
      toast.success(ToastMessages.saveSuccess);
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  return (
    <BottomSheet visible={Boolean(row)} onClose={onClose} snapPoints={['66%', '92%']}>
      {row ? (
        <View style={styles.sheetContent}>
          <AppText variant="subtitle">{row.type.labelAr}</AppText>
          <Info label="المسجد" value={`${mosque.name} - رقم ${mosque.officialCode} - ${mosque.commune}`} />
          <Info label="اسم الملف" value={row.document.originalFilename} />
          <Info label="تاريخ الرفع" value={dateAr(row.document.uploadedAt)} />
          <Info label="رقم النسخة" value={String(row.document.currentVersionNumber)} />
          <FileActionRow storageKey={row.document.storageKey} mimeType={row.document.mimeType} title={row.document.originalFilename} onError={toast.error} />
          <View style={styles.actions}>
            <ThemedButton title="فتح / مشاركة" icon={ShareNetwork} onPress={() => openStorageFile(row.document.storageKey, toast.error)} />
            <ThemedButton title="مشاركة" icon={ShareNetwork} tone="neutral" onPress={() => shareStorageFile(row.document.storageKey, toast.error)} />
            <ThemedButton title="طباعة" icon={Printer} tone="neutral" onPress={() => printStorageFile(row.document.storageKey, toast.info)} />
          </View>
          <DatePickerField label="تاريخ الإصدار" value={issueDate} onChangeText={setIssueDate} />
          {row.type.supportsExpiration ? <DatePickerField label="تاريخ الانتهاء" value={expirationDate} onChangeText={setExpirationDate} /> : null}
          <FilterChips chips={[{ key: 'false', label: 'غير مثبت' }, { key: 'true', label: 'مثبت' }]} value={String(isPinned)} onChange={(value) => setIsPinned(value === 'true')} />
          <View style={styles.actions}>
            <ThemedButton title="حفظ التعديل" icon={FloppyDisk} loading={update.isPending} disabled={update.isPending} onPress={() => update.mutate()} />
            <ThemedButton title="حذف" icon={Trash} tone="danger" onPress={() => onDelete(row.document.id)} />
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}

function ProgressionDetailSheet({
  item,
  mosque,
  onClose,
  onDelete,
  onDeleteMedia,
  onMediaPress,
}: {
  item: ProgressionEntry | null;
  mosque: Mosque;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDeleteMedia: (id: string) => void;
  onMediaPress: (media: TimelineMedia) => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [progressPercent, setProgressPercent] = useState('');
  const [shortNote, setShortNote] = useState('');

  useEffect(() => {
    setProgressPercent(item?.progressPercent !== null && item?.progressPercent !== undefined ? String(item.progressPercent) : '');
    setShortNote(item?.shortNote ?? '');
  }, [item]);

  const update = useMutation({
    mutationFn: () => {
      const newPercent = progressPercent ? Number(progressPercent) : undefined;
      // find previous progression entry (the one immediately before this item)
      const previous = progressionRows
        .filter((p) => p.createdAt < (item?.createdAt ?? ''))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (newPercent !== undefined && previous && previous.progressPercent !== null && previous.progressPercent !== undefined && newPercent < previous.progressPercent) {
        throw new Error('نسبة التقدم لا يمكن أن تكون أقل من النسبة السابقة');
      }
      return apiFetch(`/progression/${item?.id}`, { method: 'PATCH', body: { progressPercent: progressPercent ? Number(progressPercent) : undefined, shortNote } });
    },
    onSuccess: async () => {
      if (item?.mosqueId) await invalidateDetailQueries(queryClient, item.mosqueId);
      toast.success(ToastMessages.saveSuccess);
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  return (
    <BottomSheet visible={Boolean(item)} onClose={onClose} snapPoints={['58%', '88%']}>
      {item ? (
        <View style={styles.sheetContent}>
          <AppText variant="subtitle">تفاصيل تقدم الأشغال</AppText>
          <Info label="المسجد" value={`${mosque.name} - رقم ${mosque.officialCode} - ${mosque.commune}`} />
          <Info label="التاريخ" value={dateAr(item.createdAt)} />
          <ThemedInput label="نسبة التقدم %" keyboardType="numeric" value={progressPercent} onChangeText={setProgressPercent} />
          <ThemedInput label="ملاحظة" value={shortNote} onChangeText={setShortNote} multiline />
          <MediaThumbStrip media={item.media} onOpen={(media) => onMediaPress(media as TimelineMedia)} />
          {(item.media ?? []).map((media) => (
            <View key={media.id ?? media.storageKey} style={styles.mediaRow}>
              <View style={styles.mediaFile}>
                <FileActionRow storageKey={media.storageKey} mimeType={media.mimeType} title={media.autoTitle} onError={toast.error} />
              </View>
              {media.id ? <ThemedButton title="حذف الملف" icon={Trash} tone="danger" onPress={() => onDeleteMedia(media.id!)} /> : null}
            </View>
          ))}
          <View style={styles.actions}>
            <ThemedButton title="حفظ التعديل" icon={FloppyDisk} loading={update.isPending} disabled={update.isPending} onPress={() => update.mutate()} />
            <ThemedButton title="حذف" icon={Trash} tone="danger" onPress={() => onDelete(item.id)} />
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}

function ConsumptionDetailSheet({
  item,
  mosque,
  onClose,
  onDelete,
  onDeleteMedia,
  onMediaPress,
}: {
  item: ConsumptionEntry | null;
  mosque: Mosque;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDeleteMedia: (id: string) => void;
  onMediaPress: (media: TimelineMedia) => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [shortNote, setShortNote] = useState('');
  const [progressPercent, setProgressPercent] = useState('');

  useEffect(() => {
    setAmount(item?.withdrawnAmount !== null && item?.withdrawnAmount !== undefined ? String(item.withdrawnAmount) : '');
    setShortNote(item?.shortNote ?? '');
    setProgressPercent(item?.optionalProgressPercent !== null && item?.optionalProgressPercent !== undefined ? String(item.optionalProgressPercent) : '');
  }, [item]);

  const update = useMutation({
    mutationFn: () =>
      apiFetch(`/consumption/${item?.id}`, {
        method: 'PATCH',
        body: {
          withdrawnAmount: amount ? Number(amount) : undefined,
          optionalProgressPercent: progressPercent ? Number(progressPercent) : undefined,
          shortNote,
        },
      }),
    onSuccess: async () => {
      if (item?.mosqueId) await invalidateDetailQueries(queryClient, item.mosqueId);
      toast.success(ToastMessages.saveSuccess);
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  return (
    <BottomSheet visible={Boolean(item)} onClose={onClose} snapPoints={['60%', '90%']}>
      {item ? (
        <View style={styles.sheetContent}>
          <AppText variant="subtitle">تفاصيل الاستهلاك</AppText>
          <Info label="المسجد" value={`${mosque.name} - رقم ${mosque.officialCode} - ${mosque.commune}`} />
          <Info label="التاريخ" value={dateAr(item.createdAt)} />
          {item.aidRecordId ? <Info label="استفادة مرتبطة" value={item.aidRecordId} /> : null}
          <ThemedInput label="المبلغ" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <ThemedInput label="نسبة تقدم اختيارية" keyboardType="numeric" value={progressPercent} onChangeText={setProgressPercent} />
          <ThemedInput label="شرح قصير" value={shortNote} onChangeText={setShortNote} multiline />
          <MediaThumbStrip media={item.media} onOpen={(media) => onMediaPress(media as TimelineMedia)} />
          {(item.media ?? []).map((media) => (
            <View key={media.id ?? media.storageKey} style={styles.mediaRow}>
              <View style={styles.mediaFile}>
                <FileActionRow storageKey={media.storageKey} mimeType={media.mimeType} title={media.autoTitle} onError={toast.error} />
              </View>
              {media.id ? <ThemedButton title="حذف الملف" icon={Trash} tone="danger" onPress={() => onDeleteMedia(media.id!)} /> : null}
            </View>
          ))}
          <View style={styles.actions}>
            <ThemedButton title="حفظ التعديل" icon={FloppyDisk} loading={update.isPending} disabled={update.isPending} onPress={() => update.mutate()} />
            <ThemedButton title="حذف" icon={Trash} tone="danger" onPress={() => onDelete(item.id)} />
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}

function AidDetailSheet({ item, mosque, onClose, onDelete }: { item: AidEntry | null; mosque: Mosque; onClose: () => void; onDelete: (id: string) => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [aidDate, setAidDate] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<PickedUpload[]>([]);

  useEffect(() => {
    setAmount(item ? String(item.amount) : '');
    setAidDate(item?.aidDate ?? '');
    setSourceType(item?.sourceType ?? '');
    setReferenceNumber(item?.referenceNumber ?? '');
    setNotes(item?.notes ?? '');
    setFiles([]);
  }, [item]);

  const update = useMutation({
    mutationFn: async () => {
      let attachment: Record<string, unknown> = {};
      const file = files[0];
      if (file && item?.mosqueId) {
        if (file.mimeType !== 'application/pdf') throw new Error('يرجى اختيار ملف PDF للمرفق');
        const generatedFilename = buildUploadFilename(['aid', mosque.officialCode, aidDate || uploadDateStamp()], 'pdf');
        const signed = await api.signUpload({
          mimeType: file.mimeType,
          originalFilename: generatedFilename,
          folder: `mosques/${item.mosqueId}/aids`,
          fileSize: file.size,
        });
        await uploadToSignedUrl(signed.uploadUrl, file.uri, file.mimeType);
        attachment = {
          attachmentStorageKey: signed.storageKey,
          attachmentMimeType: file.mimeType,
          attachmentFileSize: file.size,
          attachmentOriginalFilename: generatedFilename,
        };
      }
      return apiFetch(`/aid-records/${item?.id}`, { method: 'PATCH', body: { amount: Number(amount), aidDate, sourceType, referenceNumber, notes, ...attachment } });
    },
    onSuccess: async () => {
      if (item?.mosqueId) await invalidateDetailQueries(queryClient, item.mosqueId);
      toast.success(ToastMessages.saveSuccess);
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  return (
    <BottomSheet visible={Boolean(item)} onClose={onClose} snapPoints={['58%', '88%']}>
      {item ? (
        <View style={styles.sheetContent}>
          <AppText variant="subtitle">تفاصيل الاستفادة</AppText>
          <Info label="المسجد" value={`${mosque.name} - رقم ${mosque.officialCode} - ${mosque.commune}`} />
          <ThemedInput label="المبلغ" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <DatePickerField label="تاريخ الاستفادة" value={aidDate} onChangeText={setAidDate} />
          <ThemedInput label="المصدر" value={sourceType} onChangeText={setSourceType} />
          <ThemedInput label="المرجع" value={referenceNumber} onChangeText={setReferenceNumber} />
          <ThemedInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
          {item.attachmentStorageKey ? (
            <>
              <FileActionRow
                storageKey={item.attachmentStorageKey}
                mimeType={item.attachmentMimeType}
                title={item.attachmentOriginalFilename ?? 'مرفق الاستفادة'}
                onError={toast.error}
              />
              <View style={styles.actions}>
                <ThemedButton title="فتح" tone="neutral" onPress={() => openStorageFile(item.attachmentStorageKey!, toast.error)} />
                <ThemedButton title="مشاركة" icon={ShareNetwork} tone="neutral" onPress={() => shareStorageFile(item.attachmentStorageKey!, toast.error)} />
                <ThemedButton title="طباعة" icon={Printer} tone="neutral" onPress={() => printStorageFile(item.attachmentStorageKey!, toast.info)} />
              </View>
            </>
          ) : null}
          <UploadPicker value={files} onChange={(next) => setFiles(next.slice(0, 1))} documentMode compact />
          <View style={styles.actions}>
            <ThemedButton title="حفظ التعديل" icon={FloppyDisk} loading={update.isPending} disabled={update.isPending} onPress={() => update.mutate()} />
            <ThemedButton title="حذف" icon={Trash} tone="danger" onPress={() => onDelete(item.id)} />
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}

function NoteDetailSheet({ item, mosque, onClose, onDelete }: { item: NoteEntry | null; mosque: Mosque; onClose: () => void; onDelete: (id: string) => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  useEffect(() => {
    setContent(item?.content ?? '');
  }, [item]);

  const update = useMutation({
    mutationFn: () => apiFetch(`/internal-notes/${item?.id}`, { method: 'PATCH', body: { mosqueId: item?.mosqueId, content } }),
    onSuccess: async () => {
      if (item?.mosqueId) await invalidateDetailQueries(queryClient, item.mosqueId);
      toast.success(ToastMessages.saveSuccess);
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : ToastMessages.saveError),
  });

  return (
    <BottomSheet visible={Boolean(item)} onClose={onClose} snapPoints={['46%', '76%']}>
      {item ? (
        <View style={styles.sheetContent}>
          <AppText variant="subtitle">ملاحظة داخلية</AppText>
          <Info label="المسجد" value={`${mosque.name} - رقم ${mosque.officialCode} - ${mosque.commune}`} />
          <ThemedInput label="الملاحظة" value={content} onChangeText={setContent} multiline />
          <View style={styles.actions}>
            <ThemedButton title="حفظ التعديل" icon={FloppyDisk} loading={update.isPending} disabled={update.isPending} onPress={() => update.mutate()} />
            <ThemedButton title="حذف" icon={Trash} tone="danger" onPress={() => onDelete(item.id)} />
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <AppCard style={styles.metric}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant="subtitle">{value}</AppText>
    </AppCard>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.info}>
      <AppText color={colors.muted}>{label}</AppText>
      <AppText color={tone}>{value}</AppText>
    </View>
  );
}

async function invalidateDetailQueries(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['mosque', id] }),
    queryClient.invalidateQueries({ queryKey: ['wallet', id] }),
    queryClient.invalidateQueries({ queryKey: ['documents', id] }),
    queryClient.invalidateQueries({ queryKey: ['progression', id] }),
    queryClient.invalidateQueries({ queryKey: ['consumption', id] }),
    queryClient.invalidateQueries({ queryKey: ['aids', id] }),
    queryClient.invalidateQueries({ queryKey: ['notes', id] }),
  ]);
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    padding: 8,
  },
  headerImage: {
    width: 58,
    height: 58,
    borderRadius: 18,
  },
  headerFallback: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    gap: 4,
  },
  overview: {
    gap: 10,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    minWidth: 155,
    flex: 1,
    gap: 6,
  },
  card: {
    gap: 10,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  list: {
    gap: 10,
  },
  itemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  sheetContent: {
    gap: 12,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaFile: {
    flex: 1,
    minWidth: 220,
  },
  settingsContainer: {
    gap: 10,
  },
  coverPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
