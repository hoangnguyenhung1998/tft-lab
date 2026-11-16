import { UnifiedStudy } from "@/components/decision-lab/UnifiedStudy";
import { StudyLibrary } from "@/components/decision-lab/StudyLibrary";
import { CURRENT_SET } from "@/lib/current-set";
import { requireSetData } from "@/lib/set-data";
import { loadComps } from "@/lib/comps";
import { loadTiers, ranksById } from "@/lib/tiers";
import { livePatch } from "@/lib/live-patch";
import { loadMeta } from "@/lib/meta";
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
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Decision Lab · V2.6.1</p>
        <h1 className="mt-2 text-3xl font-semibold">Tra cứu trang bị, lõi & đội hình</h1>
        <p className="mt-3 max-w-3xl text-sm text-dim">Tra cứu kiến thức trước trận và luyện tập sau trận. Phần tư vấn động theo trạng thái trận đã tạm khóa để bảo đảm tính cạnh tranh.</p>
        <p className="mt-2 text-xs text-dim">Set {CURRENT_SET.setNumber} · dữ liệu client {CURRENT_SET.patch} · patch ghi nhận {live.label} · đồng bộ {CURRENT_SET.syncedAt.slice(0,10)}.</p>
      </div>
      <nav aria-label="Khu vực Decision Lab" className="flex flex-wrap gap-2"><a className="btn btn-sm" href="#decision-items">Trợ lý trang bị</a><a className="btn btn-sm" href="#decision-library">Tra cứu lõi</a><a className="btn btn-sm" href="#decision-library">Thư viện kiến thức</a></nav>
      <UnifiedStudy items={set.items} champions={set.champions} augments={set.augments} comps={loadComps()} meta={loadMeta()} setNumber={CURRENT_SET.setNumber} live={live.label} fromNotes={live.fromNotes} wisps={wisps}/>
      <StudyLibrary meta={loadMeta()} champions={set.champions} items={set.items} augments={set.augments} comps={loadComps()} tiers={tiers} ranks={ranksById(set.augments,tiers?.augments)} wisps={wisps} wispSource={wisp.source} wispDate={wisp.syncedAt??wisp.verifiedOn} live={live.label} fromNotes={live.fromNotes} setNumber={CURRENT_SET.setNumber}/>
    </div>
  );
}
