import { describe, expect, it } from "vitest";
import type { Augment } from "@/lib/types";
import { matchingAugments, uniqueAugments } from "@/lib/decision/augment-picker";

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
  it("collapses duplicate Vietnamese names of equal rarity while retaining other rarities", () => {
    const duplicates: Augment[] = [
      { ...makeAugment(2), viName: "Khảm Bảo Thạch", viDesc: "Nhận {CritChance_II}% Tỉ Lệ Chí Mạng." },
      { ...makeAugment(4), viName: "Khảm Bảo Thạch", viDesc: "Nhận 10% Tỉ Lệ Chí Mạng." },
      { ...makeAugment(5), viName: "Khảm Bảo Thạch", viDesc: "Nhận 10% Tỉ Lệ Chí Mạng." },
    ];
    const unique = uniqueAugments(duplicates);
    expect(unique).toHaveLength(2);
    expect(unique.find((a) => a.tier === "silver")?.id).toBe("Aug_4");
    expect(matchingAugments(duplicates, "Kham Bao Thach", "", []).map((a) => a.id)).toHaveLength(2);
  });

  it("prevents duplicate display names across the three slots even when IDs differ", () => {
    const duplicates: Augment[] = [
      { ...makeAugment(2), viName: "Cây Tộc/Hệ+" },
      { ...makeAugment(4), viName: "Cây Tộc/Hệ+" },
      { ...makeAugment(6), viName: "Lõi khác" },
    ];
    const choices = matchingAugments(duplicates, "", "", ["Aug_2"]);
    expect(choices.map((a) => a.id)).toEqual(["Aug_6"]);
  });

  it("can match a noncanonical English source ID to its canonical Vietnamese option", () => {
    const rows: Augment[] = [
      { ...makeAugment(2), name: "Legacy Name", viName: "Lõi Tăng Trưởng", viDesc: "Nhận {XP} điểm." },
      { ...makeAugment(4), name: "Growth Core", viName: "Lõi Tăng Trưởng", viDesc: "Nhận 3 kinh nghiệm." },
    ];
    expect(matchingAugments(rows, "Legacy Name", "", []).map((a) => a.id)).toEqual(["Aug_4"]);
  });

});
