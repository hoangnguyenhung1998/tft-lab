"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import type { Augment, Champion, Item } from "@/lib/types";
import type { Comp, CompsFile } from "@/lib/comps";
import type { Rank, TiersFile } from "@/lib/tiers";
import { augmentName, augmentDescription, normalizeAugmentSearch } from "@/lib/augment-locale";
import { matchingAugments } from "@/lib/decision/augment-picker";
import { classify, categoryLabels, type AugmentCategory } from "@/lib/decision/augment-advisor";
import { carryStudy, earlyHolders, studyRole, exactPatch, PROFILE_SET_NUMBER, plans, encounters, stageNotes, commitChecklist } from "@/lib/decision/study";

export type StudyWisp = { id:string; name:string; desc:string; icon:string; cost:number|null; stage:string|null };
type Props = { champions:Champion[]; items:Item[]; augments:Augment[]; comps:CompsFile|null; tiers:TiersFile|null; ranks:Record<string,Rank>; wisps:StudyWisp[]; wispSource:string|null; wispDate:string|null; live:string; fromNotes:boolean; setNumber:number };
const field = "rounded-lg border border-gold/30 bg-panel px-3 py-2 text-sm";
const tierLabels = { silver:"Bạc", gold:"Vàng", prismatic:"Kim Cương" };
const match = (text:string, q:string) => normalizeAugmentSearch(text).includes(normalizeAugmentSearch(q.trim()));
function Icon({src}:{src:string}) { return src ? <Image src={asset(src)} alt="" width={36} height={36} unoptimized className="h-9 w-9 shrink-0 rounded object-contain"/> : null; }
function Heading({title,children}:{title:string;children:React.ReactNode}) { return <div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-xs text-dim">{children}</p></div>; }

export function StudyLibrary({champions,items,augments,comps,tiers,ranks,wisps,wispSource,wispDate,live,fromNotes,setNumber}:Props) {
  const [tab,setTab] = useState("carry");
  const [query,setQuery] = useState("");
  const [cost,setCost] = useState(0);
  const [role,setRole] = useState("");
  const [carryId,setCarryId] = useState("");
  const [rarity,setRarity] = useState("");
  const [category,setCategory] = useState("");
  const [rank,setRank] = useState("");
  const [showArchive,setShowArchive] = useState(false);
  const [checked,setChecked] = useState<string[]>([]);
  const [limit,setLimit] = useState(30);
  const fresh = exactPatch(tiers?.patch,live,fromNotes);
  const compFresh = exactPatch(comps?.patch,live,fromNotes);
  const tabs = [["carry","Carry & đồ"],["augments","Thư viện lõi"],["comps","Đội hình"],["wisps","Kỳ ngộ & Wisp"],["tempo","Tempo"],["guide","Cẩm nang"]];
  const byUnit = useMemo(() => new Map(champions.map(c=>[c.id,c])),[champions]);
  const byItem = useMemo(() => new Map(items.map(i=>[i.id,i])),[items]);
  const carries = champions.filter(c=>c.cost>=3 && (!cost || c.cost===cost) && (!role || (setNumber===PROFILE_SET_NUMBER ? studyRole(c) : "Chưa có hồ sơ").includes(role)) && match(c.name,query)).sort((a,b)=>a.cost-b.cost || a.name.localeCompare(b.name));
  const carry = carries.find(c=>c.id===carryId);
  const gear = carry ? carryStudy(carry,items) : [];
  const augList = useMemo(()=>matchingAugments(augments,query,rarity,[]).filter(a=>(!category || classify(a)===category) && (!rank || (fresh && ranks[a.id]===rank))),[augments,query,rarity,category,rank,fresh,ranks]);
  function selectTab(next:string) { setTab(next);setQuery("");setLimit(30);setRank(""); }
  function compCard(c:Comp) {
    return <article key={c.id} className="rounded-lg border border-gold/25 p-3 space-y-2">
      <h3 className="font-semibold">{c.name} <span className="text-xs text-dim">· {c.style}{compFresh ? " · Tier "+c.tier : ""}</span></h3>
      <div className="flex flex-wrap gap-2">{c.carries.map(ref=>{ const u=byUnit.get(ref.championId);return <div key={ref.championId} className="flex items-center gap-2 rounded border border-gold/25 p-2"><Icon src={u?.icon??""}/><div><p className="text-sm">{u?.name??"Tướng không còn khớp ID"}</p><p className="text-xs text-dim">{ref.items.map(id=>byItem.get(id)?.name??"Đồ chưa khớp ID").join(" · ")}</p></div></div>;})}</div>
      <details className="text-sm"><summary className="cursor-pointer">Xem hướng dẫn nguồn gốc (EN)</summary><p className="mt-2 text-dim">{c.summary}</p><ul className="mt-2 list-disc pl-5 text-dim">{c.howToPlay.map((s,i)=><li key={i}>{s}</li>)}</ul></details>
    </article>;
  }
  return <section id="decision-library" className="scroll-mt-24 panel space-y-4 p-4 sm:p-5">
    <Heading title="Thư viện kiến thức Decision Lab">Tra cứu, nghiên cứu trước trận và luyện tập sau trận. Không phải bảng chỉ định nước đi theo thời gian thực.</Heading>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Chủ đề kiến thức">{tabs.map(([id,label])=><button key={id} type="button" aria-pressed={tab===id} className={"btn btn-sm "+(tab===id?"btn-primary":"")} onClick={()=>selectTab(id!)}>{label}</button>)}</div>
    {tab==="carry" && <>
      <Heading title="Carry 3–5 vàng và người giữ đồ">Mức tương thích dựa trên hồ sơ cơ chế mùa {PROFILE_SET_NUMBER}, chưa phải BIS hay tỷ lệ thắng. Các tướng chưa có hồ sơ vẫn có mặt trong danh mục.</Heading>
      {setNumber!==PROFILE_SET_NUMBER && <p className="text-sm text-gold">Hồ sơ cơ chế chưa được thẩm định cho mùa này; không hiển thị gợi ý tương thích.</p>}
      <div className="flex flex-wrap gap-2"><input aria-label="Tìm carry thư viện" className={field} placeholder="Tìm carry..." value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Giá carry" className={field} value={cost} onChange={e=>setCost(Number(e.target.value))}><option value={0}>3–5 vàng</option>{[3,4,5].map(n=><option key={n} value={n}>{n} vàng</option>)}</select><select aria-label="Vai trò carry" className={field} value={role} onChange={e=>setRole(e.target.value)}><option value="">Mọi vai trò</option>{["AD","AP","Tank","Cận chiến","Chưa có hồ sơ"].map(n=><option key={n}>{n}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">{carries.map(c=><button key={c.id} type="button" aria-pressed={carry?.id===c.id} onClick={()=>setCarryId(c.id)} className={"flex items-center gap-2 rounded-lg border p-2 text-left "+(carry?.id===c.id?"border-gold bg-gold/10":"border-gold/25")}><Icon src={c.icon}/><span className="min-w-0 text-xs"><strong>{c.name}</strong><br/>{c.cost} vàng · {setNumber===PROFILE_SET_NUMBER?studyRole(c):"Chưa thẩm định"}</span></button>)}</div>
      {!carries.length && <p className="text-sm text-dim">Không tìm thấy tướng.</p>}
      {carry && setNumber===PROFILE_SET_NUMBER && <div className="space-y-2"><h3 className="font-semibold">{carry.name} — đồ tương thích</h3>{!gear.length && <p className="text-xs text-dim">Chưa có quy tắc phù hợp; cần đọc kỹ năng và kiểm chứng.</p>}{gear.map(({item,fit,reason})=><article key={item.id} className="rounded border border-gold/25 p-3"><div className="flex items-center gap-2"><Icon src={item.icon}/><div><strong className="text-sm">{item.name}</strong><p className="text-xs text-dim">{fit>=80?"Hợp cơ chế":"Dùng tùy tình huống"} · {reason}</p></div></div><p className="mt-2 text-xs text-dim">Giữ đồ 1–2 vàng: {earlyHolders(item,champions).map(h=>h.champion.name).join(", ")||"Chưa có hồ sơ"}</p></article>)}</div>}
    </>}
    {tab==="augments" && <>
      <Heading title="Thư viện lõi nâng cấp">Tên Việt/Anh, phân loại theo mô tả và bậc lõi. Không xác nhận pool đang hoạt động ở từng vòng.</Heading>
      <p className="text-xs text-dim">{fresh?"Tier nguồn đã ghi nhận cùng patch.": "Không có tier đã xác minh đúng patch; không gán S/A/B/C giả."} {tiers && "Nguồn lưu: "+tiers.patch+" · "+tiers.verifiedOn+". "}{tiers?.sources.map(url=><a key={url} href={url} target="_blank" rel="noreferrer" className="underline mr-2">{new URL(url).hostname}</a>)}</p>
      <div className="flex flex-wrap gap-2"><input className={field} aria-label="Tìm lõi thư viện" placeholder="Tìm tên Việt / Anh" value={query} onChange={e=>{setQuery(e.target.value);setLimit(30);}}/><select className={field} aria-label="Bậc lõi thư viện" value={rarity} onChange={e=>setRarity(e.target.value)}><option value="">Mọi bậc</option>{Object.entries(tierLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><select aria-label="Nhóm lõi" className={field} value={category} onChange={e=>setCategory(e.target.value)}><option value="">Mọi nhóm</option>{Object.entries(categoryLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>{fresh && <select aria-label="Tier sức mạnh" className={field} value={rank} onChange={e=>setRank(e.target.value)}><option value="">Mọi tier</option>{["S","A","B","C","D","F"].map(r=><option key={r}>{r}</option>)}</select>}</div>
      <p className="text-xs text-dim">{augList.length} lõi phù hợp · nhóm là phân loại theo từ khóa, cần đọc mô tả.</p>
      <div className="grid gap-2 sm:grid-cols-2">{augList.slice(0,limit).map(a=><article key={a.id} className="flex gap-2 rounded border border-gold/25 p-3"><Icon src={a.icon}/><div><h3 className="text-sm font-semibold">{augmentName(a)}</h3><p className="text-xs text-gold">{tierLabels[a.tier]} · {categoryLabels[classify(a) as AugmentCategory]} · {fresh&&ranks[a.id]?"Tier "+ranks[a.id]:"Chưa xác minh tier"}</p><p className="mt-1 text-xs text-dim">{augmentDescription(a)}</p></div></article>)}</div>
      {augList.length>limit && <button className="btn btn-sm" onClick={()=>setLimit(n=>n+30)}>Xem thêm 30 lõi</button>}
    </>}
    {tab==="comps" && <>
      <Heading title="Đội hình & điều kiện chốt bài">Đọc mẫu đội hình và kiểm tra điều kiện trước khi cam kết. Không dùng tier cũ như meta hiện tại.</Heading>
      <p className="text-sm text-dim">{comps?"Dữ liệu mẫu: "+comps.patch+" · "+comps.verifiedOn:"Chưa có dữ liệu đội hình."} {compFresh?"Cùng patch ghi nhận.":"Chưa xác minh đúng patch."}</p>
      {comps && !compFresh && <label className="flex gap-2 text-sm"><input type="checkbox" checked={showArchive} onChange={e=>setShowArchive(e.target.checked)}/> Xem đội hình cũ để nghiên cứu (không phải meta hiện tại)</label>}
      {comps && (compFresh||showArchive) && <>{comps.sources.map(url=><a key={url} href={url} target="_blank" rel="noreferrer" className="mr-3 text-xs underline">{new URL(url).hostname}</a>)}<input className={field+" w-full"} aria-label="Tìm đội hình" placeholder="Tìm đội hình..." value={query} onChange={e=>setQuery(e.target.value)}/><div className="grid gap-3 sm:grid-cols-2">{comps.comps.filter(c=>match(c.name,query)).map(compCard)}</div></>}
      <h3 className="font-semibold">Điều kiện chốt bài — tự kiểm tra</h3><div className="space-y-2">{commitChecklist.map(c=><label key={c} className="flex gap-2 text-sm"><input type="checkbox" checked={checked.includes(c)} onChange={e=>setChecked(old=>e.target.checked?[...old,c]:old.filter(x=>x!==c))}/>{c}</label>)}</div><p className="text-xs text-dim">Checklist luyện tập, không phải điểm đủ điều kiện tự động.</p>
    </>}
    {tab==="wisps" && <>
      <Heading title="Kỳ ngộ & Wisp">Kỳ ngộ theo nhóm ảnh hưởng; Wisp theo dữ liệu đã đồng bộ. Không suy diễn danh sách kỳ ngộ cụ thể chưa có nguồn.</Heading>
      <div className="grid gap-2 sm:grid-cols-2">{encounters.map(e=><article key={e.name} className="rounded border border-gold/25 p-3"><strong className="text-sm">{e.name}</strong><p className="text-xs text-dim">{e.note}</p></article>)}</div>
      <p className="text-xs text-dim">Giá và mốc Wisp: {wispDate??"chưa có ngày xác minh"} {wispSource&&<a href={wispSource} target="_blank" rel="noreferrer" className="underline">Nguồn</a>}. Mô tả gốc có thể còn tiếng Anh.</p>
      <input className={field+" w-full"} aria-label="Tìm Wisp" placeholder="Tên / hiệu ứng / mốc vòng" value={query} onChange={e=>setQuery(e.target.value)}/>
      <div className="grid gap-2 sm:grid-cols-2">{wisps.filter(w=>match(w.name+" "+w.desc+" "+(w.stage??""),query)).slice(0,limit).map(w=><article key={w.id} className="flex gap-2 rounded border border-gold/25 p-3"><Icon src={w.icon}/><div><strong className="text-sm">{w.name}</strong><p className="text-xs text-gold">{w.cost===null?"Chưa rõ giá":w.cost+" vàng"} · {w.stage??"Chưa rõ mốc"}</p><p className="text-xs text-dim">{w.desc}</p></div></article>)}</div>{wisps.filter(w=>match(w.name+" "+w.desc+" "+(w.stage??""),query)).length>limit&&<button className="btn btn-sm" onClick={()=>setLimit(n=>n+30)}>Xem thêm Wisp</button>}
    </>}
    {tab==="tempo" && <>
      <Heading title="Tempo & kinh tế">Cẩm nang nguyên tắc, không phải mốc lên cấp bắt buộc. Đọc lobby và cơ chế patch trước khi áp dụng.</Heading>
      <div className="grid gap-3 lg:grid-cols-3">{plans.map(p=><article key={p.name} className="rounded border border-gold/25 p-3 space-y-2"><h3 className="font-semibold">{p.name}</h3><p className="text-sm">{p.goal}</p><ul className="list-disc pl-4 text-xs text-dim">{p.conditions.map(c=><li key={c}>{c}</li>)}</ul><p className="text-xs text-gold">{p.stop}</p></article>)}</div>
      <h3 className="font-semibold">Chuỗi thắng / chuỗi thua</h3><p className="text-sm text-dim">Chuỗi thắng: cân nhắc giá trị giữ chuỗi so với chi phí nâng cấp. Chuỗi thua: giảm thiệt hại, tích tài nguyên có mục đích và xác định điểm dừng. Không cố thua nếu máu không đủ để chuyển tài nguyên thành sức mạnh.</p>
    </>}
    {tab==="guide" && <>
      <Heading title="Cẩm nang quyết định theo stage">Dùng để luyện tư duy và tự đánh giá quyết định sau trận.</Heading>
      {stageNotes.map(s=><article key={s.stage} className="rounded border border-gold/25 p-3"><h3 className="font-semibold">{s.stage}</h3><p className="text-sm text-dim">{s.focus}</p></article>)}
      <p className="text-sm text-dim">Ba câu hỏi sau trận: Mình biết gì tại thời điểm đó? Phương án thay thế là gì? Khi nào mình đáng lẽ phải đổi kế hoạch?</p>
    </>}
  </section>;
}
