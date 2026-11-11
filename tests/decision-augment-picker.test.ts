import { describe, expect, it } from "vitest";
import type { Augment } from "@/lib/types";
import { matchingAugments } from "@/lib/decision/augment-picker";

const makeAugment = (i: number): Augment => ({
  id: "Aug_" + i,
  name: "Augment " + i,
  desc: "Gain gold",
  tier: i % 2 ? "gold" : "silver",
  associatedTraits: [],
  icon: "",
  ...(i === 549 ? { viName: "Lõi Đặc Biệt" } : {}),
});

describe("Decision Lab exhaustive augment picker", () => {
  const augments = Array.from({ length: 594 }, (_, i) => makeAugment(i));

  it("includes all 594 synced entries when no search/filter is set", () => {
    expect(matchingAugments(augments, "", "", [])).toHaveLength(594);
  });

  it("finds translated entries outside previous 100-choice limit", () => {
    expect(matchingAugments(augments, "loi dac biet", "", []).map((a) => a.id)).toContain("Aug_549");
  });

  it("respects tier and prevents choosing the same augment twice", () => {
    const list = matchingAugments(augments, "", "silver", ["Aug_2"]);
    expect(list).toHaveLength(296);
    expect(list.some((a) => a.id === "Aug_2")).toBe(false);
  });

  it("preserves search by original English label", () => {
    expect(matchingAugments(augments, "Augment 549", "", []).map((a) => a.id)).toContain("Aug_549");
  });
});
