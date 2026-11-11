import { DecisionLab } from "@/components/decision-lab/DecisionLab";
import { CURRENT_SET } from "@/lib/current-set";
import { requireSetData } from "@/lib/set-data";

export const metadata = {
  title: "Trợ lý trang bị và lõi nâng cấp",
  description: "Nhập mảnh đồ và người giữ đồ để xem công thức, các hướng chuyển carry 3–5 vàng và mục tiêu vòng đi chợ.",
};

export default function DecisionLabPage() {
  const set = requireSetData();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Decision Lab · MVP 2.0</p>
        <h1 className="mt-2 text-3xl font-semibold">Trợ lý trang bị & chọn lõi</h1>
        <p className="mt-3 max-w-3xl text-sm text-dim">
          Chọn mảnh đồ và tướng đang giữ đồ. Xem các món ghép được, đường chuyển tướng 3–5 vàng
          và mảnh nên cân nhắc đi chợ. Đây là công cụ học cách ra quyết định, không tự chốt đội hình.
        </p>
        <p className="mt-2 text-xs text-dim">
          Set {CURRENT_SET.setNumber} · dữ liệu {CURRENT_SET.patch} · đồng bộ {CURRENT_SET.syncedAt.slice(0, 10)}.
        </p>
      </div>
      <DecisionLab champions={set.champions} items={set.items} augments={set.augments} patch={CURRENT_SET.patch} />
    </div>
  );
}
