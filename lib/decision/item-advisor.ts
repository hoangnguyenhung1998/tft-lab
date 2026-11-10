import type { Champion, Item } from "@/lib/types";

export type BoardState = "strong" | "even" | "weak";
export type DamageStyle = "tank" | "attack" | "physical" | "spell" | "caster" | "fighter" | "hybrid";
export type Confidence = "high" | "medium" | "low";

export interface ItemOption {
  item: Item;
  using: [string, string];
  holderFit: number | null;
  transfers: Array<{ champion: Champion; fit: number; reason: string }>;
  score: number;
  reason: string;
  caution: string;
  confidence: Confidence;
}

const clean = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "");
const has = (text: string, values: string[]) => values.some((value) => clean(text).includes(clean(value)));

const ATTACK_ITEMS = ["Guinsoo", "Kraken", "Red Buff", "Nashor", "Rapid Fire", "Last Whisper"];
const PHYSICAL_ITEMS = ["Infinity Edge", "Deathblade", "Last Whisper", "Giant Slayer", "Kraken", "Red Buff"];
const SPELL_ITEMS = ["Jeweled Gauntlet", "Rabadon", "Archangel", "Void Staff", "Morellonomicon"];
const CASTER_ITEMS = ["Spear of Shojin", "Blue Buff", "Adaptive Helm"];
const FIGHTER_ITEMS = ["Bloodthirster", "Hand of Justice", "Titan", "Edge of Night", "Quicksilver", "Sterak", "Striker"];
const TANK_ITEMS = ["Gargoyle", "Warmog", "Bramble Vest", "Dragon's Claw", "Spirit Visage", "Protector's Vow", "Steadfast", "Sunfire", "Ionic Spark", "Evenshroud", "Crownguard"];

export function itemStyles(item: Pick<Item, "name">): DamageStyle[] {
  const name = item.name;
  const styles: DamageStyle[] = [];
  if (has(name, TANK_ITEMS)) styles.push("tank");
  if (has(name, FIGHTER_ITEMS)) styles.push("fighter");
  if (has(name, ATTACK_ITEMS)) styles.push("attack");
  if (has(name, PHYSICAL_ITEMS)) styles.push("physical");
  if (has(name, SPELL_ITEMS)) styles.push("spell");
  if (has(name, CASTER_ITEMS)) styles.push("caster");
  if (has(name, ["Hextech Gunblade", "Giant Slayer", "Hand of Justice"])) styles.push("hybrid");
  return styles.length ? [...new Set(styles)] : ["hybrid"];
}

/** Riot data includes ability scaling and range, but not a reliable carry role.
 * This is a conservative heuristic, NOT a claim of best-in-slot or live win rate.
 */
export function championStyles(champion: Champion): DamageStyle[] {
  const styles: DamageStyle[] = [];
  const { ad, ap } = champion.ability.scaling;
  const melee = champion.stats.range <= 1;
  const description = champion.ability.desc.toLowerCase();

  if (melee) styles.push("fighter", "tank");
  else styles.push("attack", "caster");
  if (ad) styles.push("physical");
  if (ap) styles.push("spell");
  if (ad && ap) styles.push("hybrid");
  if (!ad && !ap) styles.push(description.includes("magic") ? "spell" : "hybrid");

  // Explicit, limited overrides for common Set 18 carriers. Names are case-insensitive.
  // These refine the broad heuristic, but are still not authoritative build statistics.
  const overrides: Record<string, DamageStyle[]> = {
    varus: ["physical", "attack", "caster"],
    xayah: ["physical", "attack"],
    caitlyn: ["physical", "attack"],
    tristana: ["physical", "attack"],
    masteryi: ["physical", "attack", "fighter"],
    aphelios: ["physical", "attack"],
    draven: ["physical", "attack"],
    rengar: ["physical", "fighter"],
    khazix: ["physical", "fighter"],
    ezreal: ["physical", "caster"],
    sivir: ["physical", "attack"],
    cassiopeia: ["spell", "caster"],
    ahri: ["spell", "caster"],
    morgana: ["spell", "caster"],
    zyra: ["spell", "caster"],
    lux: ["spell", "caster"],
    alune: ["spell", "caster"],
    leona: ["tank"],
    rammus: ["tank"],
    amumu: ["tank"],
    taric: ["tank"],
    maokai: ["tank"],
  };
  const override = overrides[clean(champion.name)];
  return override ?? [...new Set(styles)];
}

const STYLE_LABEL: Record<DamageStyle, string> = {
  tank: "chống chịu",
  attack: "đánh thường / tốc đánh",
  physical: "AD / sát thương vật lý",
  spell: "AP / sát thương phép",
  caster: "tung chiêu / năng lượng",
  fighter: "đấu sĩ cận chiến",
  hybrid: "linh hoạt",
};

export function compatibility(item: Item, champion: Champion): { fit: number; reason: string } {
  const items = itemStyles(item);
  const units = championStyles(champion);
  const intersections = items.filter((s) => units.includes(s) && s !== "hybrid");
  let fit = intersections.length ? Math.min(90, 56 + 15 * intersections.length) : 25;
  if (items.includes("hybrid") && units.length) fit = Math.max(fit, 52);
  if (items.includes("tank") && champion.stats.range > 1) fit = Math.min(fit, 28);
  if (items.includes("fighter") && champion.stats.range > 1) fit = Math.min(fit, 35);
  if (items.includes("attack") && units.includes("attack")) fit = Math.max(fit, 70);
  const reason = intersections.length
    ? "Cùng hướng " + intersections.map((x) => STYLE_LABEL[x]).join(", ")
    : items.includes("hybrid") ? "Có thể dùng tạm; cần kiểm tra kỹ năng cụ thể" : "Chưa thấy cơ chế phù hợp rõ ràng";
  return { fit, reason };
}

export function recipesForComponents(items: Item[], selectedIds: string[]): Array<{ item: Item; using: [string, string] }> {
  const counts = new Map<string, number>();
  for (const id of selectedIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return items.filter((i) => i.kind === "completed" && i.composition.length === 2)
    .filter((i) => {
      const [a, b] = i.composition;
      return a === b ? (counts.get(a!) ?? 0) >= 2 : (counts.get(a!) ?? 0) > 0 && (counts.get(b!) ?? 0) > 0;
    }).map((item) => ({ item, using: [item.composition[0]!, item.composition[1]!] }));
}

export function adviseItems(input: {
  items: Item[]; champions: Champion[]; components: string[]; holderId?: string;
  boardState: BoardState;
}): ItemOption[] {
  const holder = input.champions.find((c) => c.id === input.holderId);
  return recipesForComponents(input.items, input.components).map(({ item, using }) => {
    const transfers = input.champions
      .filter((champion) => champion.cost >= 3 && champion.cost <= 5)
      .map((champion) => ({ champion, ...compatibility(item, champion) }))
      .filter((c) => c.fit >= 50)
      .sort((a, b) => b.fit - a.fit || a.champion.cost - b.champion.cost || a.champion.name.localeCompare(b.champion.name));
    const holderFit = holder ? compatibility(item, holder).fit : null;
    const flexibility = new Set(transfers.filter((c) => c.fit >= 65).map((c) => c.champion.cost)).size;
    const boardWeight = input.boardState === "weak" ? 22 : input.boardState === "strong" ? 16 : 8;
    const immediate = holderFit === null ? 0 : Math.round((holderFit / 100) * boardWeight);
    const score = Math.min(100, 15 + immediate + Math.min(35, transfers.length * 3) + 8 * flexibility);
    const confidence: Confidence = holderFit !== null && holderFit >= 65 && transfers.length >= 2 ? "medium" : "low";
    return {
      item, using, holderFit, transfers: transfers.slice(0, 24), score, confidence,
      reason: holder
        ? holderFit! >= 65
          ? "Người giữ đồ hiện tại khá phù hợp theo nhóm cơ chế. Có thể ghép để tăng tempo nếu board cần sức mạnh."
          : "Người giữ đồ hiện tại không tận dụng rõ món này; cân nhắc giữ mảnh hoặc đổi người giữ."
        : "Chưa chọn người giữ đồ; chỉ xem đây là đường chuyển tiềm năng, chưa phải khuyến nghị ghép ngay.",
      caution: "Điểm là gợi ý theo vai trò/kỹ năng, KHÔNG phải tỷ lệ thắng hay trang bị BIS. Kiểm tra board, lõi và meta trước khi chốt.",
    };
  }).sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
}

export function remainingComponents(selectedIds: string[], used: [string, string]): string[] {
  const remaining = [...selectedIds];
  for (const id of used) {
    const index = remaining.indexOf(id);
    if (index >= 0) remaining.splice(index, 1);
  }
  return remaining;
}
