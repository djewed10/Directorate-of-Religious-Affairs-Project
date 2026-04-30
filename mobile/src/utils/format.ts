export function money(value?: number | null) {
  return new Intl.NumberFormat('ar-DZ', {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function dateAr(value?: string | null) {
  if (!value) return 'غير محدد';
  return new Date(value).toLocaleDateString('ar-DZ');
}

