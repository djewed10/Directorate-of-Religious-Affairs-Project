export interface OcrExtraction {
  text: string;
  officialCodeCandidates: string[];
  expirationDateCandidates: string[];
}

export function extractOfficialCodes(text: string, configuredRegex?: string) {
  const regexes = [
    configuredRegex ? new RegExp(configuredRegex, 'g') : null,
    /\d[\d\s./-]{3,}\d/g,
  ].filter(Boolean) as RegExp[];
  const candidates = new Set<string>();
  regexes.forEach((regex) => {
    [...text.matchAll(regex)].forEach((match) => {
      const normalized = match[0].replace(/[^\d]/g, '');
      if (normalized.length >= 4) candidates.add(normalized);
    });
  });
  return [...candidates].sort((a, b) => b.length - a.length);
}

export function extractDates(text: string) {
  const matches = text.match(/\b(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}-\d{2}-\d{2})\b/g) ?? [];
  return [...new Set(matches.map(normalizeDate).filter(Boolean) as string[])];
}

export function normalizeDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function extractOcrValues(text: string, officialCodeRegex?: string): OcrExtraction {
  return {
    text,
    officialCodeCandidates: extractOfficialCodes(text, officialCodeRegex),
    expirationDateCandidates: extractDates(text),
  };
}

