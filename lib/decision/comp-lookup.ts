import type { Comp } from "../comps";
export function filterComps(comps:Comp[], filters:{item:string;augment:string;carry:string;style:string}):Comp[]{
  return comps.filter(c=>(!filters.item||c.carries.some(x=>x.items.includes(filters.item))||c.board.some(x=>x[4].includes(filters.item)))&&(!filters.augment||c.augments.some(x=>x.augmentId===filters.augment))&&(!filters.carry||c.carries.some(x=>x.championId===filters.carry))&&(!filters.style||c.style===filters.style));
}
