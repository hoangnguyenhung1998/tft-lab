import type { Augment } from "@/lib/types";
import { augmentName, matchesAugmentSearch } from "@/lib/augment-locale";

/**
 * Select all matching entries, without arbitrarily truncating to the first 100.
 * This is a lookup list of synced data, not a claim that every augment can
 * appear at a given stage or in the current live game mode.
 */
export function matchingAugments(
  augments: Augment[],
  query: string,
  tier: string,
  otherSelectedIds: readonly string[],
  currentId = "",
): Augment[] {
  const unavailable = new Set(otherSelectedIds.filter((id) => id && id !== currentId));
  return augments
    .filter((augment) => (!tier || augment.tier === tier) && matchesAugmentSearch(augment, query))
    .filter((augment) => !unavailable.has(augment.id))
    .sort((a, b) => augmentName(a).localeCompare(augmentName(b), "vi") || a.id.localeCompare(b.id));
}
