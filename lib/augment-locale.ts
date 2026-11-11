import type { Augment } from "./types";

export interface AugmentTranslation {
  name: string;
  desc: string;
}
export type AugmentDictionary = Record<string, AugmentTranslation>;

export interface LocalizedAugment extends Augment {
  viName?: string;
  viDesc?: string;
}

/**
 * Join the official client locale to original set data by stable apiName.
 * Never translate IDs, tier or associated traits. Incomplete/missing entries
 * fall back to the English source rather than inventing an effect.
 */
export function extractAugmentLocale(
  original: Augment[],
  translated: Array<{ apiName: string; name: string | null; desc: string | null }>
): AugmentDictionary {
  const allowed = new Set(original.map((a) => a.id));
  const english = new Map(original.map((a) => [a.id, a]));
  const out: AugmentDictionary = {};
  for (const row of translated) {
    const source = english.get(row.apiName);
    if (!allowed.has(row.apiName) || !source) continue;
    const name = row.name?.trim() ?? "";
    const desc = row.desc?.trim() ?? "";
    if (!name || name === source.name) continue;
    out[row.apiName] = { name, desc };
  }
  return out;
}

export function applyAugmentLocale(augments: Augment[], translations: AugmentDictionary): LocalizedAugment[] {
  return augments.map((augment) => {
    const translation = translations[augment.id];
    if (!translation) return augment;
    return { ...augment, viName: translation.name, viDesc: translation.desc || undefined };
  });
}

export function augmentName(augment: LocalizedAugment): string {
  return augment.viName || augment.name;
}

export function augmentDescription(augment: LocalizedAugment): string {
  return augment.viDesc || augment.desc;
}

/** Search by Vietnamese, accent-insensitive Vietnamese, original English, and stable ID. */
export function normalizeAugmentSearch(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

export function matchesAugmentSearch(augment: LocalizedAugment, query: string): boolean {
  const q = normalizeAugmentSearch(query.trim());
  if (!q) return true;
  return normalizeAugmentSearch([
    augmentName(augment), augmentDescription(augment),
    augment.name, augment.desc, augment.id,
  ].join(" ")).includes(q);
}
