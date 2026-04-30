import type { DocumentGroup, MosqueStatusCode, RetentionPolicy } from './schema';

export const MOSQUE_STATUSES: Array<{
  code: MosqueStatusCode;
  labelAr: string;
  receivesFridayDonationsDefault: boolean;
}> = [
  { code: 'under_construction', labelAr: 'قيد البناء', receivesFridayDonationsDefault: true },
  { code: 'completed', labelAr: 'مكتمل', receivesFridayDonationsDefault: false },
  { code: 'renovation', labelAr: 'قيد الترميم', receivesFridayDonationsDefault: true },
  {
    code: 'neighborhood_no_friday',
    labelAr: 'مسجد جواري لا تقام فيه الجمعة',
    receivesFridayDonationsDefault: false,
  },
  { code: 'light_follow_up', labelAr: 'متابعة خفيفة', receivesFridayDonationsDefault: false },
  { code: 'archived', labelAr: 'أرشيف', receivesFridayDonationsDefault: false },
];

export const DOCUMENT_TYPES: Array<{
  code: string;
  labelAr: string;
  group: DocumentGroup;
  supportsExpiration: boolean;
  isPinnedDefault?: boolean;
  isRequiredDefault?: boolean;
  retentionPolicy: RetentionPolicy;
}> = [
  {
    code: 'land_registry_book',
    labelAr: 'الدفتر العقاري للأرض',
    group: 'mosque_file',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'land_allocation_decision',
    labelAr: 'قرار التخصيص',
    group: 'mosque_file',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'waqf_or_ownership_contract',
    labelAr: 'عقد الوقف أو الملكية',
    group: 'mosque_file',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'building_permit',
    labelAr: 'رخصة البناء',
    group: 'mosque_file',
    supportsExpiration: false,
    isPinnedDefault: true,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'engineering_plans',
    labelAr: 'المخططات الهندسية',
    group: 'mosque_file',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'association_foundation_minutes',
    labelAr: 'محضر تأسيس الجمعية',
    group: 'association_file',
    supportsExpiration: true,
    retentionPolicy: 'archive_old_versions',
  },
  {
    code: 'association_basic_law',
    labelAr: 'القانون الأساسي للجمعية',
    group: 'association_file',
    supportsExpiration: true,
    retentionPolicy: 'archive_old_versions',
  },
  {
    code: 'association_approval',
    labelAr: 'الاعتماد',
    group: 'association_file',
    supportsExpiration: true,
    retentionPolicy: 'archive_old_versions',
  },
  {
    code: 'literary_report',
    labelAr: 'التقرير الأدبي',
    group: 'association_file',
    supportsExpiration: true,
    retentionPolicy: 'archive_old_versions',
  },
  {
    code: 'financial_report',
    labelAr: 'التقرير المالي',
    group: 'association_file',
    supportsExpiration: true,
    retentionPolicy: 'archive_old_versions',
  },
  {
    code: 'technical_sheet',
    labelAr: 'البطاقة التقنية',
    group: 'technical',
    supportsExpiration: false,
    isPinnedDefault: true,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'study_office_report',
    labelAr: 'تقرير مكتب الدراسات',
    group: 'technical',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'project_cost_estimate',
    labelAr: 'كشف تقدير تكلفة المشروع',
    group: 'technical',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'cte_control_report',
    labelAr: 'تقرير المراقبة التقنية للأشغال CTE',
    group: 'technical',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'previous_aid_record',
    labelAr: 'وثيقة آخر استفادة',
    group: 'financial',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'aid_receipt',
    labelAr: 'وصل استلام الإعانة',
    group: 'financial',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'cheque_image',
    labelAr: 'صورة الصك أو الشيك',
    group: 'consumption',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'consumption_statement',
    labelAr: 'كشف الاستهلاك',
    group: 'consumption',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'materials_invoice',
    labelAr: 'فاتورة مواد البناء',
    group: 'consumption',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'services_invoice',
    labelAr: 'فاتورة خدمات أو أشغال',
    group: 'consumption',
    supportsExpiration: false,
    retentionPolicy: 'keep_all_versions',
  },
  {
    code: 'handwritten_note_image',
    labelAr: 'صورة ملاحظة مكتوبة بخط اليد',
    group: 'consumption',
    supportsExpiration: false,
    retentionPolicy: 'archive_old_versions',
  },
  {
    code: 'progress_report',
    labelAr: 'تقرير تقدم الأشغال',
    group: 'progression',
    supportsExpiration: false,
    retentionPolicy: 'archive_old_versions',
  },
  {
    code: 'progress_photos',
    labelAr: 'صور تقدم الأشغال',
    group: 'progression',
    supportsExpiration: false,
    retentionPolicy: 'archive_old_versions',
  },
  {
    code: 'administrative_other',
    labelAr: 'وثيقة إدارية أخرى',
    group: 'other',
    supportsExpiration: true,
    retentionPolicy: 'replace_after_confirmation',
  },
  {
    code: 'technical_other',
    labelAr: 'وثيقة تقنية أخرى',
    group: 'other',
    supportsExpiration: false,
    retentionPolicy: 'replace_after_confirmation',
  },
  {
    code: 'financial_other',
    labelAr: 'وثيقة مالية أخرى',
    group: 'other',
    supportsExpiration: false,
    retentionPolicy: 'replace_after_confirmation',
  },
];

export const PROGRESSION_STAGES = [
  ['foundations', 'الأساسات'],
  ['structure', 'الهيكل'],
  ['roof', 'السقف'],
  ['walls', 'الجدران'],
  ['electricity', 'الكهرباء'],
  ['plumbing', 'السباكة'],
  ['plastering', 'التلبيس'],
  ['equipment', 'التجهيزات'],
  ['final_arrangement', 'التهيئة النهائية'],
  ['other', 'أخرى'],
] as const;

export const CONSUMPTION_CATEGORIES = [
  ['building_materials', 'مواد بناء'],
  ['labor', 'يد عاملة'],
  ['equipment', 'تجهيزات'],
  ['technical_study', 'دراسة تقنية'],
  ['specialized_works', 'أشغال متخصصة'],
  ['account_withdrawal', 'سحب مبلغ من الحساب'],
  ['other', 'أخرى'],
] as const;

export const NOTE_TEMPLATES = [
  ['document_expired', 'الوثيقة منتهية', 'الوثيقة منتهية وتحتاج إلى تجديد.'],
  ['renewal_requested', 'تم طلب التحيين', 'تم إرسال طلب تحيين للمعنيين.'],
  ['insufficient_photos', 'الصور غير كافية', 'الصور المرفوعة غير كافية لتقييم الوضعية.'],
  ['technical_sheet_missing', 'البطاقة التقنية ناقصة', 'البطاقة التقنية تحتاج إلى استكمال.'],
  ['file_needs_completion', 'الملف يحتاج استكمال', 'ملف المسجد يحتاج إلى وثائق إضافية.'],
  ['upload_clearer_copy', 'يرجى رفع نسخة أوضح', 'يرجى طلب نسخة أوضح من الوثيقة.'],
  ['update_progress_percent', 'يرجى تحديث نسبة التقدم', 'ينبغي تحديث نسبة تقدم الأشغال.'],
  ['send_consumption_docs', 'يرجى إرسال وثائق الاستهلاك', 'ينبغي إرسال وثائق الاستهلاك والصور الداعمة.'],
  ['no_update_for_period', 'لم يتم إرسال تحديث منذ مدة', 'لم يصل أي تحديث منذ مدة ويحتاج المسجد إلى متابعة.'],
] as const;

