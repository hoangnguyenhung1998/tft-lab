import type { Augment } from "@/lib/types";
import {
  augmentDescription, augmentName, matchesAugmentSearch, normalizeAugmentSearch,
} from "@/lib/augment-locale";

/**
 * The synced pool contains historical/alternate entries with different IDs
 * but the same player-facing name + rarity. Only one is shown to prevent
 * duplicate choices. This is presentation deduplication: the raw pool and
 * original IDs remain untouched.
 */
export function augmentDisplayKey(augment: Augment): string {
  return augment.tier + ":" + normalizeAugmentSearch(augmentName(augment).trim()).replace(/\s+/g, " ");
}

function quality(augment: Augment): number {
  const desc = augmentDescription(augment).trim();
  const unresolved = (desc.match(/\{[^}]+\}|\[[A-Za-z][A-Za-z0-9_]*\]|%[A-Za-z0-9:_]+%/g) ?? []).length;
  return (augment.viName ? 80 : 0) + (augment.viDesc ? 20 : 0)
    + (desc.length > 12 ? 10 : 0) - unresolved * 40
    + Math.min(20, Math.floor(desc.length / 40));
}

/** Canonicalize before search: duplicate rows must not crowd out valid results. */
export function uniqueAugments(augments: readonly Augment[]): Augment[] {
  const selected = new Map<string, Augment>();
  for (const augment of augments) {
    const key = augmentDisplayKey(augment);
    const previous = selected.get(key);
    if (!previous || quality(augment) > quality(previous)
      || (quality(augment) === quality(previous) && augment.id.localeCompare(previous.id) < 0)) {
      selected.set(key, augment);
    }
  }
  return [...selected.values()].sort(
    (a, b) => augmentName(a).localeCompare(augmentName(b), "vi") || a.tier.localeCompare(b.tier),
  );
}

/**
 * Search the original pool so an English / legacy alias can still find a
 * translated canonical entry. No 100-result cap and no duplicate display keys.
 */
export function matchingAugments(
  augments: Augment[],
  query: string,
  tier: string,
  otherSelectedIds: readonly string[],
  currentId = "",
): Augment[] {
  const byId = new Map(augments.map((a) => [a.id, a]));
  const selectedKeys = new Set(otherSelectedIds
    .filter((id) => id && id !== currentId)
    .map((id) => byId.get(id)).filter((a): a is Augment => !!a)
    .map(augmentDisplayKey));
  const canonical = uniqueAugments(augments);
  const matchedKeys = new Set(augments
    .filter((a) => matchesAugmentSearch(a, query))
    .map(augmentDisplayKey));
  return canonical.filter((a) =>
    (!tier || a.tier === tier)
    && matchedKeys.has(augmentDisplayKey(a))
    && !selectedKeys.has(augmentDisplayKey(a)),
  );
}
