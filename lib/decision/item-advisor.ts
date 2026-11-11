import type { Champion, Item } from "@/lib/types";

export type BoardState = "strong" | "even" | "weak";
export type DamageStyle = "tank" | "attack" | "physical" | "spell" | "caster" | "fighter" | "hybrid";
export type Confidence = "medium" | "low";
export type Advice = "slam" | "consider" | "hold";

export interface ItemOption {
  item: Item;
  using: [string, string];
  holderFit: number | null;
  transfers: Array<{ champion: Champion; fit: number; reason: string }>;
  score: number;
  reason: string;
  caution: string;
  confidence: Confidence;
  advice: Advice;
}

const clean = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * Set 18: deliberately reviewed roles only. Do not infer AP caster from
 * having a ranged attack or from an incidental AP coefficient.
 * These paths are mechanical compatibility, not patch-specific BIS.
 */
type Role = "tank" | "auto" | "ad-caster" | "ap-caster" | "ap-sustain" | "melee-ad" | "melee-ap";
const profiles: Record<string, Role[]> = {
  varus:["auto","ad-caster"], xayah:["auto"], caitlyn:["auto"],
  kayle:["auto"], yunara:["ad-caster"], veigar:["ap-caster"],
  leblanc:["ap-caster"], teemo:["ap-caster"], camille:["melee-ad"],
  warwick:["melee-ad"], rakan:["tank"], kobuko:["tank"], yorick:["tank"],
  leona:["tank"], shen:["tank"], sejuani:["tank"], elise:["tank"],
  tristana:["auto","ad-caster"], masteryi:["auto","melee-ad"],
  kogmaw:["auto"], rengar:["melee-ad"], khazix:["melee-ad"],
  cassiopeia:["ap-caster","ap-sustain"], azir:["ap-sustain"],
  fiddlesticks:["ap-caster"], diana:["melee-ap"],
  vi:["melee-ad"], rammus:["tank"], hecarim:["tank"], krug:["tank"],
  aphelios:["auto"], sivir:["auto","ad-caster"], ezreal:["ad-caster"],
  brambleback:["melee-ad"], ahri:["ap-caster"], morgana:["ap-caster","ap-sustain"],
  zyra:["ap-caster","ap-sustain"], soraka:["ap-caster"], lillia:["melee-ap"],
  nidalee:["melee-ad"], sett:["tank","melee-ad"], amumu:["tank"],
  malphite:["tank"], sentinel:["tank"], draven:["auto"],
  ashe:["ad-caster","auto"], elderdragon:["ad-caster"], lux:["ap-caster"],
  alune:["ap-caster","ap-sustain"], gnar:["melee-ad"], taric:["tank"],
  maokai:["tank"],
};
const roleOf = (champion: Champion): Role[] => profiles[clean(champion.name)] ?? [];
const adRoles: Role[] = ["auto","ad-caster","melee-ad"];
const apRoles: Role[] = ["ap-caster","ap-sustain","melee-ap"];
const damageRoles: Role[] = [...adRoles,...apRoles];

interface GearRule { pattern: RegExp; primary: Role[]; secondary?: Role[]; why: string }
const gear: GearRule[] = [
  {pattern:/guinsoo|rageblade/i,primary:["auto"],secondary:["ap-sustain"],why:"Cần giao tranh lâu và đánh thường để tích tốc đánh."},
  {pattern:/archangel/i,primary:["ap-sustain"],secondary:["ap-caster","melee-ap"],why:"AP tăng theo thời gian; cần frontline chống chịu đủ lâu."},
  {pattern:/rabadon|deathcap/i,primary:apRoles,why:"Ưu tiên carry gây sát thương phép thực sự, không chỉ có hệ số AP phụ."},
  {pattern:/jeweled gauntlet/i,primary:["ap-caster","ap-sustain"],secondary:["melee-ap"],why:"Ưu tiên sát thương phép từ kỹ năng."},
  {pattern:/blue buff/i,primary:["ap-caster"],secondary:["ad-caster"],why:"Cần tướng tận dụng nhiều lần tung chiêu."},
  {pattern:/shojin/i,primary:["ap-caster","ad-caster"],secondary:["ap-sustain"],why:"Cần chu kỳ tung chiêu phù hợp."},
  {pattern:/infinity edge|deathblade|last whisper/i,primary:adRoles,why:"Ưu tiên sát thương vật lý; kiểm tra nhu cầu chí mạng/xuyên giáp."},
  {pattern:/giant slayer/i,primary:damageRoles,why:"Sát thương linh hoạt; kiểm tra máu mục tiêu."},
  {pattern:/kraken|red buff/i,primary:["auto"],secondary:["ad-caster"],why:"Ưu tiên đòn đánh thường và duy trì hiệu ứng."},
  {pattern:/void staff/i,primary:apRoles,why:"Giảm kháng phép cho đội hình phép."},
  {pattern:/morellonomicon/i,primary:["ap-caster","ap-sustain"],why:"Tận dụng kỹ năng trúng nhiều mục tiêu và giảm hồi phục."},
  {pattern:/nashor/i,primary:["ap-sustain","auto"],secondary:["ap-caster"],why:"Tận dụng tốc đánh trong chu kỳ dùng kỹ năng."},
  {pattern:/hextech gunblade/i,primary:["ap-caster","ap-sustain"],secondary:["ad-caster"],why:"Gây sát thương liên tục để hồi phục đồng đội."},
  {pattern:/bloodthirster|titan.s resolve|sterak|edge of night|quicksilver|striker.s flail/i,primary:["melee-ad","melee-ap"],secondary:["tank"],why:"Cần carry cận chiến sống sót để gây sát thương."},
  {pattern:/hand of justice/i,primary:["melee-ad","melee-ap"],secondary:["ad-caster","ap-caster"],why:"Đồ linh hoạt sát thương/hồi phục."},
  {pattern:/gargoyle|warmog|bramble vest|dragon.s claw|spirit visage|protector.s vow|steadfast heart|sunfire cape|ionic spark|evenshroud|crownguard|adaptive helm/i,primary:["tank"],secondary:["melee-ap"],why:"Ưu tiên tuyến trước, tùy đối thủ và cách xếp cờ."},
];
const ruleOf = (item: Pick<Item, "name">): GearRule | undefined => gear.find((r) => r.pattern.test(item.name));

export function itemStyles(item: Pick<Item, "name">): DamageStyle[] {
  const rule = ruleOf(item);
  if (!rule) return [];
  const styles: DamageStyle[] = [];
  for (const role of rule.primary) {
    if (role === "tank") styles.push("tank");
    if (role === "auto") styles.push("attack");
    if (role === "ad-caster" || role === "melee-ad") styles.push("physical");
    if (role === "ap-caster" || role === "ap-sustain" || role === "melee-ap") styles.push("spell");
  }
  return [...new Set(styles)];
}

export function championStyles(champion: Champion): DamageStyle[] {
  const styles: DamageStyle[] = [];
  for (const role of roleOf(champion)) {
    if (role === "tank") styles.push("tank");
    if (role === "auto") styles.push("attack","physical");
    if (role === "ad-caster") styles.push("physical","caster");
    if (role === "ap-caster" || role === "ap-sustain") styles.push("spell","caster");
    if (role === "melee-ad") styles.push("physical","fighter");
    if (role === "melee-ap") styles.push("spell","fighter");
  }
  return [...new Set(styles)];
}

export function compatibility(item: Item, champion: Champion): { fit: number; reason: string } {
  const rule = ruleOf(item);
  const roles = roleOf(champion);
  if (!rule) return {fit:0,reason:"Trang bị chưa có quy tắc đã kiểm tra."};
  if (!roles.length) return {fit:0,reason:"Tướng chưa có hồ sơ cơ chế; không suy đoán chỉ từ tầm đánh."};
  if (roles.some((r) => rule.primary.includes(r))) return {fit:85,reason:rule.why};
  if (roles.some((r) => rule.secondary?.includes(r))) return {fit:55,reason:"Có thể dùng trong một số cách chơi. "+rule.why};
  return {fit:10,reason:"Cơ chế tướng không phù hợp nhóm sử dụng chính."};
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
      .filter((c) => c.fit >= 55)
      .sort((a,b) => b.fit-a.fit || a.champion.cost-b.champion.cost || a.champion.name.localeCompare(b.champion.name));
    const holderFit = holder ? compatibility(item,holder).fit : null;
    const verifiedTransfers = transfers.filter((c) => c.fit >= 80).length;
    const known = !!ruleOf(item);
    const advice: Advice = !known || holderFit === 0 || (holderFit !== null && holderFit < 55) ? "hold"
      : holderFit !== null && holderFit >= 80 && verifiedTransfers > 0 && input.boardState !== "strong" ? "slam" : "consider";
    const score = Math.max(0,Math.min(100,Math.round(
      (holderFit === null ? 15 : holderFit * 0.62) +
      (verifiedTransfers > 0 ? 20 : 0) + Math.min(12,verifiedTransfers*2) +
      (input.boardState === "weak" && holderFit !== null && holderFit >= 80 ? 8 : 0)
    )));
    let reason: string;
    if (!known) reason = "Ghép được nhưng chưa có đánh giá cơ chế được kiểm tra; không nên dựa vào điểm số để quyết định.";
    else if (!holder) reason = "Chưa chọn người giữ đồ. Đây là các hướng chuyển tiềm năng, chưa phải đề xuất ghép ngay.";
    else if (holderFit === 0) reason = "Chưa đủ dữ liệu về tướng hoặc trang bị để kết luận.";
    else if (holderFit !== null && holderFit < 55) reason = holder.name + " chưa phù hợp với " + item.name + " theo cơ chế đã kiểm tra. Có thể giữ mảnh hoặc tìm người giữ đồ khác.";
    else if (holderFit !== null && holderFit < 80) reason = holder.name + " có thể dùng tạm, nhưng chưa phải hướng ưu tiên. Hãy xem đường chuyển và lượng máu trước khi ghép.";
    else if (input.boardState === "strong") reason = holder.name + " sử dụng được món này. Board mạnh: cân nhắc ghép để giữ chuỗi hoặc để dành nếu đã đủ lực.";
    else reason = holder.name + " có cơ chế phù hợp và có đường chuyển. Có thể ghép để tăng sức mạnh ngay nếu cần giữ máu.";
    return {
      item, using, holderFit, transfers, score, advice,
      confidence: (known && holderFit !== null && holderFit >= 55 ? "medium" : "low") as Confidence,
      reason,
      caution:"Các hướng chuyển được kiểm tra theo nhóm cơ chế, KHÔNG phải BIS hay tỷ lệ thắng bản hiện tại. Lõi, lobby và đội hình có thể thay đổi quyết định.",
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
