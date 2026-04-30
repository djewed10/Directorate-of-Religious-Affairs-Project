export function pageLimit(page = 1, limit = 20) {
  const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  return {
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

export function dateOnly(value?: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

