import type { Item, Champion, Trait } from "../types";
import type { Comp } from "../comps";
export type ViEntry={name:string;desc?:string};
export type DecisionLocale={setNumber:number;patch:string;items:Record<string,ViEntry>;champions:Record<string,ViEntry>;traits:Record<string,ViEntry>};
export const displayName=(x:{name:string;viName?:string})=>x.viName||x.name;
export const displayDesc=(x:{desc:string;viDesc?:string})=>x.viDesc||x.desc;
export function applyNames<T extends Item|Champion|Trait>(rows:T[],entries:Record<string,ViEntry>):T[]{return rows.map(x=>{const v=entries[x.id];return v?{...x,viName:v.name,viDesc:v.desc}:x;});}
export const styleVi:Record<Comp["style"],string>={"fast-9":"Lên cấp 9 nhanh",standard:"Lên cấp theo nhịp chuẩn",reroll:"Đổi cửa hàng nâng sao",emblem:"Đội hình cần ấn / lõi"};
export const stageVi:Record<string,string>={stage2:"Giai đoạn 2",stage3:"Giai đoạn 3",stage4:"Giai đoạn 4",stage5:"Giai đoạn 5 trở đi"};
export function translatedText(source:string,dict:Record<string,string>):string{return dict[source]||source;}
