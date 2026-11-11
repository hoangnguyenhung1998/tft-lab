import { describe, expect, it } from "vitest";
import type { Champion, Item } from "@/lib/types";
import { adviseItems, championStyles, compatibility, recipesForComponents, remainingComponents } from "@/lib/decision/item-advisor";

function component(id: string): Item {
  return { id, name: id, desc: "", icon: "", composition: [], kind: "component", effects: {}, associatedTraits: [], rich: "" };
}
function completed(id: string, name: string, first: string, second: string): Item {
  return { ...component(id), name, kind: "completed", composition: [first, second] };
}
function champion(name: string, cost: 1 | 2 | 3 | 4 | 5, range: number): Champion {
  return {
    id: name, name, cost, traits: [], icon: "",
    stats: { hp: 650, ad: 55, armor: 30, mr: 30, range, mana: 50, initialMana: 0, attackSpeed: 0.7, critChance: 0.25, critMultiplier: 1.4 },
    ability: { name: "Ability", desc: "", icon: "", scaling: { ad: true, ap: false }, rich: "" },
  };
}
const items = [
  component("bow"), component("rod"), component("sword"), component("vest"), component("cloak"),
  completed("rageblade", "Guinsoo's Rageblade", "bow", "rod"),
  completed("giant", "Giant Slayer", "sword", "bow"),
  completed("bramble", "Bramble Vest", "vest", "vest"),
  completed("stoneplate", "Gargoyle Stoneplate", "vest", "cloak"),
];

describe("Decision Lab item adviser", () => {
  it("finds all valid recipes using three components, without using nonexistent combinations", () => {
    const result = recipesForComponents(items, ["bow", "rod", "sword"]);
    expect(result.map((r) => r.item.id).sort()).toEqual(["giant", "rageblade"]);
  });

  it("requires two copies of an identical component", () => {
    expect(recipesForComponents(items, ["vest"]).map((r) => r.item.id)).not.toContain("bramble");
    expect(recipesForComponents(items, ["vest", "vest"]).map((r) => r.item.id)).toContain("bramble");
  });

  it("removes exactly the used components while retaining duplicates", () => {
    expect(remainingComponents(["bow", "bow", "rod"], ["bow", "rod"])).toEqual(["bow"]);
  });

  it("separates melee fighter from tank instead of treating every melee carry as tank", () => {
    const rengar = champion("Rengar", 3, 1);
    const amumu = champion("Amumu", 4, 1);
    expect(championStyles(rengar)).not.toContain("tank");
    expect(championStyles(amumu)).toContain("tank");
    const stoneplate = items.find((i) => i.id === "stoneplate")!;
    expect(compatibility(stoneplate, amumu).fit).toBeGreaterThan(compatibility(stoneplate, rengar).fit);
  });

  it("includes holder fit, 3–5 cost transfers, and low-confidence warnings", () => {
    const champions = [champion("Varus", 1, 4), champion("Tristana", 3, 4), champion("Aphelios", 4, 4), champion("Draven", 5, 4)];
    const results = adviseItems({ items, champions, components: ["bow", "rod", "sword"], holderId: "Varus", boardState: "strong" });
    const rageblade = results.find((o) => o.item.id === "rageblade")!;
    expect(rageblade.holderFit).not.toBeNull();
    expect(rageblade.transfers.every((c) => c.champion.cost >= 3)).toBe(true);
    expect(rageblade.transfers.map((c) => c.champion.name)).toEqual(expect.arrayContaining(["Tristana", "Aphelios", "Draven"]));
    expect(rageblade.caution).toContain("KHÔNG");
  });
  it("does not recommend Archangel's Staff for Xayah and does not list AD carries as AP transfers", () => {
    const archangel = completed("archangel", "Archangel's Staff", "rod", "tear");
    const deathcap = completed("deathcap", "Rabadon's Deathcap", "rod", "rod");
    const testItems = [...items, component("tear"), archangel, deathcap];
    const champions = [
      champion("Xayah", 1, 4), champion("Rengar", 3, 1),
      champion("Aphelios", 4, 4), champion("Cassiopeia", 3, 4),
      champion("Morgana", 4, 4), champion("Alune", 5, 4)
    ];
    const options = adviseItems({items:testItems,champions,components:["rod","rod","tear"],holderId:"Xayah",boardState:"even"});
    const selected = options.find((o) => o.item.id === "archangel")!;
    expect(selected.advice).toBe("hold");
    expect(selected.holderFit).toBeLessThan(55);
    expect(selected.transfers.map((t) => t.champion.name)).not.toContain("Aphelios");
    expect(selected.transfers.map((t) => t.champion.name)).not.toContain("Rengar");
    expect(selected.transfers.map((t) => t.champion.name)).toContain("Cassiopeia");
    expect(selected.transfers.map((t) => t.champion.name)).toContain("Alune");
    expect(options.map((o) => o.item.id).sort()).toEqual(["archangel","deathcap"]);
  });

  it("does not invent carry fit for unknown champion profiles", () => {
    const unknown = champion("Unreviewed Champion", 4, 4);
    const rageblade = items.find((i) => i.id === "rageblade")!;
    expect(compatibility(rageblade, unknown).fit).toBe(0);
    expect(championStyles(unknown)).toEqual([]);
  });

  it("accounts for board state without equating strong board with mandatory slamming", () => {
    const champions = [champion("Varus", 1, 4), champion("Tristana", 3, 4)];
    const base = {items,champions,components:["bow","rod"],holderId:"Varus"};
    const strong = adviseItems({...base,boardState:"strong"}).find((o) => o.item.id === "rageblade")!;
    const weak = adviseItems({...base,boardState:"weak"}).find((o) => o.item.id === "rageblade")!;
    expect(strong.advice).toBe("consider");
    expect(weak.advice).toBe("slam");
  });

});
