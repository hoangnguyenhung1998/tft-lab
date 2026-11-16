import type {Item} from "@/lib/types";
import Image from "next/image";
import {asset} from "@/lib/asset";
export function RecipeReference({items}:{items:Item[]}){
 const byId=new Map(items.map(i=>[i.id,i]));
 return <section id="decision-items" className="panel p-4 space-y-3 scroll-mt-24"><h2 className="text-xl font-semibold">Công thức trang bị</h2><p className="text-sm text-dim">Danh mục công thức cố định. Không xếp hạng món đồ theo trạng thái trận.</p><div className="grid grid-cols-2 gap-2 md:grid-cols-3">{items.filter(i=>i.kind==="completed"&&i.composition.length===2).map(i=><article key={i.id} className="rounded border border-gold/25 p-2 flex items-center gap-2">{i.icon&&<Image src={asset(i.icon)} alt="" width={32} height={32} unoptimized/>}<div><strong className="text-xs">{i.name}</strong><p className="text-xs text-dim">{i.composition.map(id=>byId.get(id)?.name??id).join(" + ")}</p></div></article>)}</div></section>
}
