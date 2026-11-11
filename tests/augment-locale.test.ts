import { describe, expect, it } from "vitest";
import type { Augment } from "@/lib/types";
import {
  applyAugmentLocale, augmentDescription, augmentName,
  extractAugmentLocale, matchesAugmentSearch,
} from "@/lib/augment-locale";

const augment = (id: string, name: string, desc: string): Augment => ({
  id, name, desc, tier: "gold", icon: "", associatedTraits: [],
});

describe("Vietnamese augment localization", () => {
  const source = [
    augment("Aug_Gold", "Golden Opportunity", "Gain 5 gold."),
    augment("Aug_Speed", "Rapid Growth", "Gain 10 XP."),
  ];
  const raw = [
    { apiName: "Aug_Gold", name: "Cơ Hội Vàng", desc: "Nhận 5 vàng." },
    { apiName: "Aug_Speed", name: "Phát Triển Nhanh", desc: "Nhận 10 kinh nghiệm." },
    { apiName: "Aug_Unknown", name: "Không tồn tại", desc: "Không được thêm." },
  ];

  it("joins translations only by stable augment ID", () => {
    const dict = extractAugmentLocale(source, raw);
    expect(Object.keys(dict)).toHaveLength(2);
    expect(dict.Aug_Gold.name).toBe("Cơ Hội Vàng");
    expect(dict.Aug_Unknown).toBeUndefined();
  });

  it("shows Vietnamese while retaining English names and descriptions for rule engine", () => {
    const translated = applyAugmentLocale(source, extractAugmentLocale(source, raw));
    expect(augmentName(translated[0]!)).toBe("Cơ Hội Vàng");
    expect(augmentDescription(translated[0]!)).toBe("Nhận 5 vàng.");
    expect(translated[0]!.name).toBe("Golden Opportunity");
    expect(translated[0]!.desc).toBe("Gain 5 gold.");
    expect(source[0]!.viName).toBeUndefined();
  });

  it("searches Vietnamese with or without accents and still finds the English original", () => {
    const a = applyAugmentLocale(source, extractAugmentLocale(source, raw))[0]!;
    expect(matchesAugmentSearch(a, "co hoi vang")).toBe(true);
    expect(matchesAugmentSearch(a, "Cơ hội vàng")).toBe(true);
    expect(matchesAugmentSearch(a, "golden opportunity")).toBe(true);
    expect(matchesAugmentSearch(a, "nhan 5 vang")).toBe(true);
  });

  it("falls back to English safely if translation is absent or partial", () => {
    const rows = applyAugmentLocale(source, {
      Aug_Gold: { name: "Cơ Hội Vàng", desc: "" },
    });
    expect(augmentDescription(rows[0]!)).toBe("Gain 5 gold.");
    expect(augmentName(rows[1]!)).toBe("Rapid Growth");
  });
});
