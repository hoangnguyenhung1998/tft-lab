import type { Champion, Item } from "@/lib/types";
import { championStyles, compatibility } from "./item-advisor";

export const PROFILE_SET_NUMBER = 18;

export function carryStudy(champion: Champion, items: Item[]) {
  return items.filter(i => i.kind === "completed")
    .map(item => ({ item, ...compatibility(item, champion) }))
    .filter(x => x.fit >= 55)
    .sort((a,b) => b.fit-a.fit || a.item.name.localeCompare(b.item.name));
}

export function earlyHolders(item: Item, champions: Champion[]) {
  return champions.filter(c => c.cost <= 2)
    .map(champion => ({ champion, ...compatibility(item, champion) }))
    .filter(x => x.fit >= 55)
    .sort((a,b) => b.fit-a.fit || a.champion.name.localeCompare(b.champion.name));
}

export function studyRole(champion: Champion): string {
  const s = championStyles(champion);
  if (!s.length) return "Chưa có hồ sơ";
  return [s.includes("physical") ? "AD" : "", s.includes("spell") ? "AP" : "", s.includes("tank") ? "Chống chịu" : "", s.includes("fighter") ? "Cận chiến" : "", s.includes("attack") ? "Đánh thường" : ""].filter(Boolean).join(" · ");
}

export function exactPatch(curated: string | undefined, live: string, fromNotes: boolean): boolean {
  return !!curated && fromNotes && curated.trim().toLowerCase() === live.trim().toLowerCase();
}

export const plans = [
  { name: "Lên cấp 8 nhanh", goal: "Ổn định với chủ lực 4 vàng và dàn chắn.", conditions: ["Có kinh tế để lên 8 và còn tiền đổi cửa hàng.", "Đồ có thể chuyển sang ít nhất hai chủ lực.", "Chưa bị ép đổi cửa hàng sâu ở cấp 7."], stop: "Nếu đang mất nhiều máu, ổn định ở cấp 7; không lên 8 chỉ vì đến mốc quen thuộc." },
  { name: "Lên cấp 9 nhanh", goal: "Nâng trần đội hình bằng tướng đắt tiền.", conditions: ["Đội hình cấp 8 đã đủ sức giao tranh.", "Máu đủ chịu thêm các vòng chờ.", "Còn ngân sách đổi cửa hàng sau khi lên cấp 9."], stop: "Nếu đội hình 8 chưa ổn định hoặc phải phụ thuộc duy nhất một tướng 5 vàng, ưu tiên nâng cấp đội hình 8." },
  { name: "Đổi cửa hàng nâng sao tướng 3 vàng", goal: "Tìm chủ lực 3 vàng 3 sao và tuyến trước phù hợp.", conditions: ["Có nhiều bản sao tự nhiên.", "Ít nhà tranh cùng tướng.", "Đồ hợp cơ chế và kinh tế đủ đổi cửa hàng."], stop: "Nếu thiếu bản sao, bị tranh hoặc máu cạn, dùng tướng 2 sao để ổn định rồi đổi kế hoạch." },
];
export const encounters = [
  { name: "Nhiều trang bị", note: "Nghiên cứu phân bổ cho cả chủ lực lẫn chống chịu; phòng đấu cũng có thêm sức mạnh, không mặc định được chơi chậm." },
  { name: "Ít trang bị", note: "Ưu tiên món linh hoạt; kiểm tra liệu chủ lực có đủ sát thương và tuyến trước có đủ đồ." },
  { name: "Nhiều vàng / kinh nghiệm", note: "Mặt bằng nhịp độ có thể tăng. Phân biệt tài nguyên của cả phòng đấu với lợi thế riêng." },
  { name: "Thay đổi cửa hàng / tướng", note: "Đọc điều kiện cụ thể của kỳ ngộ, kiểm tra cơ hội nâng sao và mức độ tranh bài." },
];
export const stageNotes = [
  { stage: "2-1", focus: "Đồ mở hướng nào? Đội hình có đủ mạnh để giữ chuỗi? Lõi có điều kiện gì? Chưa cần khóa bài." },
  { stage: "3-2", focus: "Kiểm tra đồ đã ghép, hướng chủ lực, nâng cấp tuyến trước và chi phí ổn định." },
  { stage: "4-2", focus: "Chọn kế hoạch thực tế dựa trên sức mạnh, lượng máu, tài nguyên và khả năng hoàn thiện đội hình." },
  { stage: "5+", focus: "Nâng sao, hoàn thiện đồ, quan sát đối thủ và xếp cờ. Chỉ nâng cấp khi còn đủ tài nguyên." },
];
export const commitChecklist = ["Chủ lực sử dụng được đồ đã ghép", "Có tuyến trước khả thi", "Đủ điều kiện của lõi hoặc tộc hệ", "Có nguồn tướng / không bị tranh quá nặng", "Còn máu và vàng để hoàn thiện", "Có hướng thay thế nếu không ra chủ lực"];
