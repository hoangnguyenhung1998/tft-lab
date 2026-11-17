"use client";
import { useState } from "react";
import {displayName} from "@/lib/decision/locale";
import type { MetaFile } from "@/lib/meta";
import type { Champion, Item } from "@/lib/types";
import { normalizeAugmentSearch } from "@/lib/augment-locale";
import Image from "next/image";
import { asset } from "@/lib/asset";

export function MetaExplorer({meta,champions,items}:{meta:MetaFile|null;champions:Champion[];items:Item[]}) {
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState("games");
  const [item,setItem]=useState("");
  const [limit,setLimit]=useState(20);
  const units=new Map(champions.map(c=>[c.id,c]));
  const gear=new Map(items.map(i=>[i.id,i]));
  const pct=(v:number)=>Math.round(v*100)+"%";
  const rows=(meta?.comps??[]).filter(c=>normalizeAugmentSearch([c.name,...c.units.map(u=>units.get(u.id)?displayName(units.get(u.id)!):"")].join(" ")).includes(normalizeAugmentSearch(query.trim())) && (!item||c.units.some(u=>u.items.includes(item)))).sort((a,b)=>sort==="avg"?a.avg-b.avg:sort==="top4"?b.top4-a.top4:b.games-a.games);
  return <section className="panel space-y-3 p-4 mb-4">
    <h2 className="text-xl font-semibold">Thống kê theo bản vá — thống kê trận đã kết thúc</h2>
    {!meta?<p className="text-sm text-dim">Chưa có thống kê đạt điều kiện của bản vá hiện tại. Không dùng số liệu cũ thay thế. Sau khi Riot phê duyệt quyền API và đồng bộ thành công, dữ liệu sẽ xuất hiện tại đây.</p>:<>
    <p className="text-sm text-dim">Phiên bản {meta.patch} · {meta.matches} trận · {meta.players} lượt người chơi · {meta.platforms.join(", ")} · {meta.syncedAt.slice(0,16)} UTC. Mẫu trận từ ladder xếp hạng cao, gồm toàn bộ người tham gia; không đại diện mọi bậc xếp hạng. Nhóm theo hai tộc hệ nổi bật, không phải hướng dẫn hoàn chỉnh hay trang bị tối ưu.</p>
    <div className="flex flex-wrap gap-2">
      <input aria-label="Tìm nhóm meta" className="rounded border border-gold/30 bg-panel p-2 text-sm" placeholder="Tên tộc hệ / tướng" value={query} onChange={e=>{setQuery(e.target.value);setLimit(20);}}/>
      <select aria-label="Lọc trang bị quan sát" className="rounded border border-gold/30 bg-panel p-2 text-sm" value={item} onChange={e=>{setItem(e.target.value);setLimit(20);}}><option value="">Mọi trang bị</option>{items.filter(i=>i.kind==="completed").map(i=><option key={i.id} value={i.id}>{displayName(i)}</option>)}</select>
      <select aria-label="Sắp xếp thống kê" className="rounded border border-gold/30 bg-panel p-2 text-sm" value={sort} onChange={e=>setSort(e.target.value)}><option value="games">Số mẫu</option><option value="avg">Thứ hạng trung bình</option><option value="top4">Top 4</option></select>
    </div>
    <p className="text-xs text-dim">{rows.length} nhóm. Lọc thư viện theo trang bị đã quan sát, không xếp hạng theo tình huống trong trận.</p>
    <div className="grid gap-3 lg:grid-cols-2">{rows.slice(0,limit).map(c=><article key={c.key} className="rounded border border-gold/25 p-3 space-y-2"><h3 className="font-semibold">{c.name}</h3><p className="text-sm">TB {c.avg.toFixed(2)} · Top 4 {pct(c.top4)} · Top 1 {pct(c.win)} · {c.games} mẫu</p><div className="flex flex-wrap gap-2">{c.units.map(u=><div key={u.id} className="flex items-center gap-1 rounded border border-gold/20 p-1"><span>{units.get(u.id)?.icon&&<Image src={asset(units.get(u.id)!.icon)} alt="" width={32} height={32} unoptimized/>}</span><div className="text-xs"><strong>{units.get(u.id)?displayName(units.get(u.id)!):u.id}</strong> · {pct(u.freq)}<p className="text-dim">{u.items.map(i=>gear.get(i)?displayName(gear.get(i)!):i).join(" / ")}</p></div></div>)}</div></article>)}</div>
    {!rows.length&&<p className="text-sm text-dim">Không có nhóm phù hợp bộ lọc.</p>}
    {rows.length>limit&&<button className="btn btn-sm" onClick={()=>setLimit(n=>n+20)}>Xem thêm</button>}
    <p className="text-xs text-dim">Nguồn: Riot TFT Match API. Tỷ lệ quan sát không chứng minh quan hệ nhân quả; không có thống kê lõi.</p></>}
  </section>;
}
