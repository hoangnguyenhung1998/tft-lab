import { DecisionLab } from "@/components/decision-lab/DecisionLab";
import { StudyLibrary } from "@/components/decision-lab/StudyLibrary";
import { CURRENT_SET } from "@/lib/current-set";
import { requireSetData } from "@/lib/set-data";
import { loadComps } from "@/lib/comps";
import { loadTiers, ranksById } from "@/lib/tiers";
import { livePatch } from "@/lib/live-patch";
import { loadWispInfo } from "@/lib/wisps";

export const metadata = { title: "Trợ lý trang bị và lõi nâng cấp", description: "Decision Lab: nghiên cứu trang bị, lõi, carry, đội hình và tempo." };

export default function DecisionLabPage() {
  const set = requireSetData();
  const tiers = loadTiers();
  const live = livePatch();
  const wisp = loadWispInfo();
  const wisps = set.items.filter(i=>i.kind==="charm").map(i=>{const info=wisp.lookup(i.name);return {id:i.id,name:i.name,desc:i.desc,icon:i.icon,cost:info?.cost??null,stage:info?.stage??null};});
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Decision Lab · V2.5</p>
        <h1 className="mt-2 text-3xl font-semibold">Trợ lý trang bị & chọn lõi</h1>
        <p className="mt-3 max-w-3xl text-sm text-dim">Nghiên cứu hướng chơi, luyện tập lựa chọn lõi và tra cứu kiến thức. Không phải công cụ tự quyết định trong trận.</p>
        <p className="mt-2 text-xs text-dim">Set {CURRENT_SET.setNumber} · dữ liệu client {CURRENT_SET.patch} · patch ghi nhận {live.label} · đồng bộ {CURRENT_SET.syncedAt.slice(0,10)}.</p>
      </div>
      <nav aria-label="Khu vực Decision Lab" className="flex flex-wrap gap-2"><a className="btn btn-sm" href="#decision-items">Trợ lý trang bị</a><a className="btn btn-sm" href="#decision-augments">Bài tập chọn lõi</a><a className="btn btn-sm" href="#decision-library">Thư viện kiến thức</a></nav>
      <DecisionLab champions={set.champions} items={set.items} augments={set.augments} patch={CURRENT_SET.patch} />
      <StudyLibrary champions={set.champions} items={set.items} augments={set.augments} comps={loadComps()} tiers={tiers} ranks={ranksById(set.augments,tiers?.augments)} wisps={wisps} wispSource={wisp.source} wispDate={wisp.syncedAt??wisp.verifiedOn} live={live.label} fromNotes={live.fromNotes} setNumber={CURRENT_SET.setNumber}/>
    </div>
  );
}
