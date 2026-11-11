import type { Augment, Champion, Item } from "@/lib/types";
import { classifyTags, type Tag } from "@/lib/tags";
import { championStyles, itemStyles, type BoardState } from "./item-advisor";

export type AugmentStage = "2-1" | "3-2" | "4-2";
export type AugmentCategory = "combat" | "economy" | "items" | "reroll" | "levels" | "traits" | "champions" | "flex";
export type Evidence = "context" | "limited";

export interface AugmentContext {
  stage: AugmentStage;
  board: BoardState;
  holder?: Champion;
  equipped?: Item[];
  components?: Item[];
  health?: number;
  gold?: number;
  previous?: Augment[];
}

export interface AugmentAssessment {
  augment: Augment;
  category: AugmentCategory;
  categoryLabel: string;
  score: number;
  evidence: Evidence;
  benefits: string[];
  risks: string[];
  rationale: string;
}

const categoryLabels: Record<AugmentCategory, string> = {
  combat: "Giao tranh", economy: "Kinh tế", items: "Trang bị", reroll: "Reroll",
  levels: "Lên cấp", traits: "Tộc hệ", champions: "Tướng", flex: "Linh hoạt / chưa rõ"
};

function classify(augment: Augment): AugmentCategory {
  const text = (augment.name + " " + augment.desc).toLowerCase();
  // A description may mention multiple features; treat special mechanisms first.
  if (/\b(roll|reroll|shop refresh|shop reroll|free refresh|free reroll)\b/.test(text)) return "reroll";
  if (/\b(level up|leveling|experience|\bxp\b|level 8|level 9)\b/.test(text)) return "levels";
  if (augment.associatedTraits.length || /\bemblem\b|trait breakpoint|trait count/.test(text)) return "traits";
  const tags: Tag[] = classifyTags(augment.name, augment.desc, augment.associatedTraits);
  if (tags.includes("item")) return "items";
  if (tags.includes("econ")) return "economy";
  if (tags.includes("combat")) return "combat";
  if (tags.includes("champion")) return "champions";
  return "flex";
}

function coherentItemDirection(ctx: AugmentContext): "physical" | "spell" | "mixed" | "unknown" {
  const equipped = ctx.equipped ?? [];
  const styles = equipped.flatMap((item) => itemStyles(item));
  const physical = styles.filter((s) => s === "physical" || s === "attack").length;
  const spell = styles.filter((s) => s === "spell").length;
  if (physical > spell && physical > 0) return "physical";
  if (spell > physical && spell > 0) return "spell";
  return physical + spell ? "mixed" : "unknown";
}

export function assessAugment(augment: Augment, ctx: AugmentContext): AugmentAssessment {
  const category = classify(augment);
  const benefits: string[] = [];
  const risks: string[] = [];
  let score = 50;
  const board = ctx.board;
  const hp = ctx.health;
  const lowHp = hp !== undefined && hp <= (ctx.stage === "2-1" ? 55 : 40);
  const itemDirection = coherentItemDirection(ctx);
  const holder = ctx.holder;
  const unitStyles = holder ? championStyles(holder) : [];
  const traitMatches = augment.associatedTraits.some((id) => holder?.traits.includes(id));
  const previouslyChosen = ctx.previous ?? [];
  const previouslyEconomic = previouslyChosen.some((a) => classify(a) === "economy" || classify(a) === "levels");
  const previouslyCombat = previouslyChosen.some((a) => classify(a) === "combat");

  switch (category) {
    case "combat":
      benefits.push("Tăng sức mạnh giao tranh hoặc khả năng giữ máu; hiệu quả cụ thể phụ thuộc mô tả lõi.");
      if (board === "weak" || lowHp) { score += 18; benefits.push("Đang yếu/mất máu: nên ưu tiên giải pháp phát huy sớm."); }
      if (board === "strong") { score += 7; benefits.push("Có thể hỗ trợ duy trì chuỗi thắng nếu phù hợp cơ chế."); }
      if (ctx.stage === "4-2") score += 6;
      if (previouslyEconomic && ctx.stage !== "2-1") score += 5;
      break;
    case "economy":
      benefits.push("Tăng tài nguyên để nâng cấp hoặc roll; không mặc định phải đánh chuỗi thua.");
      if (ctx.stage === "2-1") score += 16;
      if (board === "strong") score += 8;
      if (board === "weak") { score -= 9; risks.push("Board yếu: tài nguyên đến chậm có thể khiến mất máu thêm."); }
      if (lowHp) { score -= 15; risks.push("Máu thấp: cần kiểm tra khả năng ổn định ngay."); }
      if (ctx.stage === "4-2") { score -= 10; risks.push("Đến 4-2, lõi kinh tế cần thời gian hoàn vốn; kiểm tra thời điểm nhận thưởng."); }
      if (previouslyEconomic && ctx.stage !== "2-1") risks.push("Đã có lõi kinh tế: xem có đang thiếu sức mạnh giao tranh không.");
      break;
    case "levels":
      benefits.push("Có thể hỗ trợ lên cấp nhanh, nhưng không tự quyết định Fast 8/Fast 9.");
      if (ctx.stage === "2-1") score += 12;
      if (board === "strong") score += 9;
      if (board === "weak" || lowHp) { score -= 11; risks.push("Nếu mất máu nhanh, phải ổn định board thay vì chỉ tích XP."); }
      if (ctx.stage === "4-2") risks.push("Cần kiểm tra lợi ích lên cấp còn kịp phát huy không.");
      break;
    case "reroll":
      benefits.push("Tăng số lần tìm tướng; hợp khi có mục tiêu nâng sao và đủ tài nguyên.");
      if (ctx.stage === "3-2") score += 5;
      if (board === "weak") score += 3;
      risks.push("Chưa có số bản sao, cấp và mức độ tranh bài: không đủ cơ sở khuyên force reroll.");
      if (ctx.stage === "4-2") risks.push("Kiểm tra còn đủ thời gian để hoàn thiện tướng mục tiêu.");
      break;
    case "items":
      benefits.push("Thêm/chuyển đổi trang bị; so sánh với đồ đã ghép và người giữ đồ hiện tại.");
      if ((ctx.components?.length ?? 0) > 0) score += 6;
      if ((ctx.equipped?.length ?? 0) === 0) score += 4;
      if (board === "weak") score += 5;
      risks.push("Có đồ không có nghĩa chắc chắn giữ chuỗi thắng; cần xem ai sử dụng được.");
      break;
    case "traits":
      benefits.push("Có thể mở mốc tộc hệ; cần có đủ quân và mốc kích hoạt.");
      if (traitMatches) { score += 12; benefits.push("Tướng đang chọn có hệ liên quan đến lõi."); }
      else risks.push("Chưa chứng minh được mốc hệ khả thi từ một tướng giữ đồ.");
      if (ctx.stage === "4-2") risks.push("Chuyển hệ muộn có thể tốn vàng và máu.");
      break;
    case "champions":
      benefits.push("Thêm tài nguyên tướng, có thể cải thiện board hoặc tạo hướng nâng sao.");
      risks.push("Phải xem tướng nhận được có nâng cấp đội hình ngay hay không.");
      if (board === "weak") score += 3;
      break;
    default:
      benefits.push("Đọc chính xác mô tả lõi trước khi lựa chọn.");
      risks.push("Chưa đủ tín hiệu để tự động xếp hạng tác động của cơ chế này.");
  }

  const description = (augment.name + " " + augment.desc).toLowerCase();
  // These are hints about named mechanics, not authoritative parsing of their rewards.
  if (/attack speed|basic attack|on.hit/i.test(description) && itemDirection === "physical") {
    score += 5; benefits.push("Có một số trang bị hướng đánh thường/AD để xem xét kết hợp.");
  }
  if (/ability power|magic damage|spell damage/i.test(description) && itemDirection === "spell") {
    score += 5; benefits.push("Trang bị đã ghép đang thiên phép, có khả năng phối hợp.");
  }
  if (/attack speed|basic attack/i.test(description) && unitStyles.includes("attack")) score += 4;
  if (/ability power|magic damage/i.test(description) && unitStyles.includes("spell")) score += 4;
  if (/\bloss streak\b|lose rounds|lose a round/i.test(description)) risks.push("Lõi có điều kiện thua: đánh giá khả năng giữ máu, không mặc định cố thua.");
  if (/\bwin streak\b|win rounds/i.test(description)) risks.push("Lõi có điều kiện thắng: cần scout các nhà để đánh giá xác suất duy trì chuỗi.");
  if (previouslyCombat && ctx.stage === "4-2" && category === "economy") risks.push("Kiểm tra lõi có đủ thời gian chuyển vàng thành sức mạnh cuối trận.");

  const evidence: Evidence = category === "flex" || category === "reroll" || category === "traits" ? "limited" : "context";
  return {
    augment, category, categoryLabel: categoryLabels[category], score: Math.max(0, Math.min(100, score)),
    evidence, benefits, risks,
    rationale: "Đánh giá quy tắc theo board, mốc vòng, trang bị và mô tả lõi; không phải tỷ lệ thắng hoặc khuyến nghị từ AI."
  };
}

export function compareAugments(offered: Augment[], ctx: AugmentContext): AugmentAssessment[] {
  return offered.map((augment) => assessAugment(augment, ctx))
    .sort((a,b) => b.score-a.score || a.augment.name.localeCompare(b.augment.name));
}
