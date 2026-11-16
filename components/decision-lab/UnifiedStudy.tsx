"use client";
import {useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {asset} from "@/lib/asset";
import type {Champion,Item,Augment} from "@/lib/types";
import type {CompsFile} from "@/lib/comps";
import type {MetaFile} from "@/lib/meta";
import {recipesForComponents,remainingComponents,compatibility} from "@/lib/decision/item-advisor";
import {encounters,plans,studyRole,exactPatch,PROFILE_SET_NUMBER} from "@/lib/decision/study";
import {filterComps} from "@/lib/decision/comp-lookup";
import {augmentName,augmentDescription} from "@/lib/augment-locale";
import type {StudyWisp} from "./StudyLibrary";
type Props={items:Item[];champions:Champion[];augments:Augment[];comps:CompsFile|null;meta:MetaFile|null;setNumber:number;live:string;fromNotes:boolean;wisps:StudyWisp[]};
const field="rounded border border-gold/30 bg-panel p-2 text-sm";
function Icon({src}:{src:string}){return src?<Image src={asset(src)} alt="" width={36} height={36} unoptimized className="h-9 w-9 shrink-0 rounded object-contain"/>:null}
export function UnifiedStudy({items,champions,augments,comps,meta,setNumber,live,fromNotes,wisps}:Props){
 const [selected,setSelected]=useState<string[]>([]);
 const [itemId,setItemId]=useState("");
 const [carryId,setCarryId]=useState("");
 const [compId,setCompId]=useState("");
 const [encounter,setEncounter]=useState("");
 const [wispId,setWispId]=useState("");
 const [archive,setArchive]=useState(false);
 const byItem=new Map(items.map(i=>[i.id,i]));
 const byUnit=new Map(champions.map(c=>[c.id,c]));
 const byAug=new Map(augments.map(a=>[a.id,a]));
 const components=items.filter(i=>i.kind==="component").sort((a,b)=>a.name.localeCompare(b.name));
 const recipes=recipesForComponents(items,selected).sort((a,b)=>a.item.name.localeCompare(b.item.name));
 const recipe=recipes.find(r=>r.item.id===itemId);
 const item=recipe?.item;
 const remaining=recipe?remainingComponents(selected,recipe.using):selected;
 const candidates=item&&setNumber===PROFILE_SET_NUMBER?champions.map(champion=>({champion,...compatibility(item,champion)})).filter(x=>x.fit>=55).sort((a,b)=>a.champion.cost-b.champion.cost||a.champion.name.localeCompare(b.champion.name)):[];
 const carry=candidates.find(c=>c.champion.id===carryId)?.champion;
 const fresh=exactPatch(comps?.patch,live,fromNotes);
 const guides=item&&(fresh||archive)?filterComps(comps?.comps??[],{item:item.id,carry:carry?.id??"",augment:"",style:""}).sort((a,b)=>a.name.localeCompare(b.name)):[];
 const guide=guides.find(c=>c.id===compId);
 const wisp=wisps.find(w=>w.id===wispId);
 const observations=item?(meta?.comps??[]).filter(c=>c.units.some(u=>u.items.includes(item.id)&&(!carry||u.id===carry.id))).sort((a,b)=>b.games-a.games):[];
 function changeComponents(next:string[]){setSelected(next);setItemId("");setCarryId("");setCompId("");}
 function chooseItem(id:string){setItemId(id);setCarryId("");setCompId("");}
 return <section id="decision-items" className="panel p-4 sm:p-5 space-y-5 scroll-mt-24">
 <div><h2 className="text-xl font-semibold">Luồng nghiên cứu thống nhất</h2><p className="text-xs text-dim">Tra cứu trước trận hoặc ôn tập sau trận. Các bộ lọc là liên kết danh mục, không chấm điểm hay khuyên quyết định theo trạng thái trận.</p></div>
 <div className="space-y-2"><h3 className="font-semibold">1. Kỳ ngộ & Wisp</h3><div className="flex flex-wrap gap-2"><select aria-label="Nhóm kỳ ngộ" className={field} value={encounter} onChange={e=>setEncounter(e.target.value)}><option value="">Chọn nhóm kỳ ngộ</option>{encounters.map(x=><option key={x.name}>{x.name}</option>)}</select><select aria-label="Tra cứu Wisp" className={field} value={wispId} onChange={e=>setWispId(e.target.value)}><option value="">Chọn Wisp</option>{wisps.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
 <p className="text-xs text-dim">Chỉ có nhóm kỳ ngộ tổng quát; chưa có danh mục tên và hiệu ứng kỳ ngộ đã xác minh theo patch.</p>
 {encounter&&<p className="text-sm">{encounters.find(x=>x.name===encounter)?.note}</p>}{wisp&&<div className="flex gap-2"><Icon src={wisp.icon}/><div className="text-sm">{wisp.name} · {wisp.cost??"?"} vàng · {wisp.stage??"Chưa rõ mốc"}<p className="text-xs text-dim">{wisp.desc}</p></div></div>}</div>
 <div className="space-y-2"><h3 className="font-semibold">2. Mảnh trang bị ({selected.length}/8)</h3><div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{components.map(c=><button type="button" key={c.id} disabled={selected.length>=8} onClick={()=>changeComponents([...selected,c.id])} aria-label={"Thêm "+c.name} className="rounded border border-gold/25 p-2 flex flex-col items-center gap-1 disabled:opacity-40"><Icon src={c.icon}/><span className="text-xs text-center">{c.name}</span></button>)}</div><div className="flex flex-wrap gap-2">{selected.map((id,i)=><button type="button" key={i} className="btn btn-sm" onClick={()=>changeComponents(selected.filter((_,j)=>i!==j))}>{byItem.get(id)?.name??id} ×</button>)}{selected.length>0&&<button type="button" className="btn btn-sm" onClick={()=>changeComponents([])}>Xóa hết</button>}</div></div>
 <div className="space-y-2"><h3 className="font-semibold">3. Công thức ghép khả thi</h3><p className="text-xs text-dim">Các phương án độc lập, không phải tất cả có thể ghép đồng thời. Chọn một món để xem tài liệu.</p><div className="grid gap-2 sm:grid-cols-3">{recipes.map(r=><button key={r.item.id} type="button" aria-pressed={itemId===r.item.id} onClick={()=>chooseItem(r.item.id)} className={"flex gap-2 items-center text-left rounded border p-2 "+(itemId===r.item.id?"border-gold bg-gold/10":"border-gold/25")}><Icon src={r.item.icon}/><div className="text-xs"><strong>{r.item.name}</strong><p>{r.using.map(id=>byItem.get(id)?.name??id).join(" + ")}</p></div></button>)}</div>{!recipes.length&&<p className="text-sm text-dim">Chọn ít nhất hai mảnh có công thức hợp lệ.</p>}{item&&<p className="text-sm">Mảnh còn dư nếu ghép {item.name}: {remaining.map(id=>byItem.get(id)?.name??id).join(", ")||"Không còn"}</p>}</div>
 <div className="space-y-2"><h3 className="font-semibold">4. Carry & người giữ đồ</h3><p className="text-xs text-dim">Tương thích cơ chế từ hồ sơ mùa {PROFILE_SET_NUMBER}; không phải BIS. Sắp theo giá và tên, không xếp hạng quyết định.</p>{item&&setNumber!==PROFILE_SET_NUMBER&&<p className="text-sm text-dim">Hồ sơ chưa được xác minh cho mùa này.</p>}{item&&<><div className="flex flex-wrap gap-2">{candidates.map(({champion,reason})=><button key={champion.id} type="button" aria-pressed={carryId===champion.id} onClick={()=>{setCarryId(carryId===champion.id?"":champion.id);setCompId("");}} title={reason} className={"flex gap-1 items-center rounded border p-1 "+(carryId===champion.id?"border-gold bg-gold/10":"border-gold/25")}><Icon src={champion.icon}/><span className="text-xs">{champion.name}<br/>{champion.cost} vàng · {studyRole(champion)}</span></button>)}</div>{!candidates.length&&<p className="text-xs text-dim">Chưa có hồ sơ tương thích.</p>}{carry&&<p className="text-sm">{carry.name}: {compatibility(item,carry).reason}</p>}</>}</div>
 <div className="space-y-2"><h3 className="font-semibold">5. Đội hình tham khảo</h3><p className="text-xs text-dim">Nguồn hướng dẫn: {comps?.patch??"chưa có"} · {comps?.verifiedOn??""}. Khớp ID trang bị và carry trong hướng dẫn, không suy ra sức mạnh.</p>{comps&&!fresh&&<label className="flex gap-2 text-sm"><input type="checkbox" checked={archive} onChange={e=>{setArchive(e.target.checked);setCompId("");}}/>Xem hướng dẫn patch cũ</label>}{item&&<div className="flex flex-wrap gap-2">{guides.map(g=><button type="button" key={g.id} aria-pressed={compId===g.id} className={"btn btn-sm "+(compId===g.id?"btn-primary":"")} onClick={()=>setCompId(g.id)}>{g.name}</button>)}</div>}{item&&!guides.length&&<p className="text-xs text-dim">Không có hướng dẫn khớp bộ lọc. Có thể bỏ chọn carry hoặc xem nguồn lưu trữ.</p>}{guide&&<div className="space-y-2"><Link href={"/set/comps/#comp-"+guide.id} className="underline text-sm">Mở đội hình {guide.name}</Link><div className="flex flex-wrap gap-2">{guide.board.map(([id,row,col])=><div key={row+"-"+col} className="flex items-center gap-1 text-xs"><Icon src={byUnit.get(id)?.icon??""}/>{byUnit.get(id)?.name??id}</div>)}</div><p className="text-xs text-dim">{guide.summary}</p></div>}</div>
 <div className="space-y-2"><h3 className="font-semibold">6. Lõi trong hướng dẫn</h3>{guide?guide.augments.map(a=>{const aug=byAug.get(a.augmentId);return <article key={a.augmentId} className="flex gap-2 border border-gold/25 rounded p-2"><Icon src={aug?.icon??""}/><div className="text-xs"><strong>{aug?augmentName(aug):"Lõi cũ chưa khớp ID"}</strong><p>{aug?augmentDescription(aug):a.augmentId}</p>{a.note&&<p className="text-dim">{a.note}</p>}</div></article>}):<p className="text-xs text-dim">Chọn hướng dẫn đội hình để đọc lõi liên quan. Không có tỷ lệ thắng lõi từ API.</p>}</div>
 <div className="space-y-2"><h3 className="font-semibold">7. Tempo & điều kiện triển khai</h3>{guide&&<><p className="text-sm">Lối chơi nguồn: {guide.style}</p><ul className="list-disc pl-5 text-xs text-dim">{guide.howToPlay.map((x,i)=><li key={i}>{x}</li>)}</ul>{guide.stages&&Object.entries(guide.stages).map(([k,v])=><p key={k} className="text-xs"><strong>{k}: </strong>{v}</p>)}</>}<details><summary className="cursor-pointer text-sm">Cẩm nang tempo chung</summary>{plans.map(p=><article key={p.name} className="mt-2 text-xs"><strong>{p.name}</strong><p>{p.goal}</p><p>{p.conditions.join(" · ")}</p><p>{p.stop}</p></article>)}</details></div>
 <div className="space-y-2"><h3 className="font-semibold">8. Meta quan sát</h3>{!meta?<p className="text-xs text-dim">Chưa có dữ liệu Riot đạt điều kiện patch hiện tại.</p>:<><p className="text-xs text-dim">Client {meta.patch} · {meta.matches} trận · {meta.syncedAt}. Thống kê toàn nhóm hai tộc hệ; không phải tỷ lệ riêng của món đồ hoặc đội hình hướng dẫn.</p>{observations.slice(0,12).map(c=><article key={c.key} className="rounded border border-gold/25 p-2 text-sm">{c.name} · TB {c.avg.toFixed(2)} · Top 4 {Math.round(c.top4*100)}% · Top 1 {Math.round(c.win*100)}% · {c.games} mẫu</article>)}</>}</div>
 </section>
}
