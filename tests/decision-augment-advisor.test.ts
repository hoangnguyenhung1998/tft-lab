import { describe, expect, it } from "vitest";
import type { Augment } from "@/lib/types";
import { assessAugment, compareAugments } from "@/lib/decision/augment-advisor";

const sample = (name: string, desc: string, tier: Augment["tier"] = "gold"): Augment => ({
  id: name, name, desc, tier, icon: "", associatedTraits: [],
});

describe("Decision Lab V2 augment advisor", () => {
  const economy = sample("Economic Growth", "Gain 12 gold now and additional gold after each stage.");
  const combat = sample("Combat Guard", "Your team gains Armor and Magic Resist during combat.");
  const item = sample("Item Grab Bag", "Gain a completed item and a component.");
  const reroll = sample("Rolling For Days", "Gain free shop rerolls each round.");
  const unknown = sample("Mystery", "A strange effect occurs.");

  it("supports all three augment rounds and keeps context-aware recommendations separate", () => {
    for (const stage of ["2-1", "3-2", "4-2"] as const) {
      const ranked = compareAugments([economy, combat, item], { stage, board: "even" });
      expect(ranked).toHaveLength(3);
      expect(new Set(ranked.map((x) => x.augment.id)).size).toBe(3);
    }
  });
  it("does not infer econ means loss-streak and rewards early econ when strong", () => {
    const result = assessAugment(economy, { stage: "2-1", board: "strong" });
    expect(result.category).toBe("economy");
    expect(result.benefits.join(" ")).toContain("không mặc định phải đánh chuỗi thua");
    expect(result.score).toBeGreaterThan(50);
  });
  it("recognizes risk of late economy at low HP", () => {
    const early = assessAugment(economy, { stage: "2-1", board: "strong" });
    const late = assessAugment(economy, { stage: "4-2", board: "weak", health: 28 });
    expect(late.score).toBeLessThan(early.score);
    expect(late.risks.length).toBeGreaterThan(0);
  });
  it("distinguishes item and reroll mechanics and flags missing reroll evidence", () => {
    expect(assessAugment(item, { stage: "2-1", board: "even" }).category).toBe("items");
    const rolling = assessAugment(reroll, { stage: "3-2", board: "even" });
    expect(rolling.category).toBe("reroll");
    expect(rolling.evidence).toBe("limited");
    expect(rolling.risks.join(" ")).toContain("bản sao");
  });
  it("refuses fabricated certainty on unknown augments", () => {
    const result = assessAugment(unknown, { stage: "2-1", board: "even" });
    expect(result.category).toBe("flex");
    expect(result.evidence).toBe("limited");
  });
});
