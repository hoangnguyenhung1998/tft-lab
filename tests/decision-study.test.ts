import { describe, expect, it } from "vitest";
import { exactPatch, carryStudy, earlyHolders } from "@/lib/decision/study";
import type { Champion, Item } from "@/lib/types";
const champion = (name:string,cost:Champion["cost"]) => ({id:name,name,cost} as Champion);
const item = (name:string,kind:Item["kind"]="completed") => ({id:name,name,kind} as Item);
describe("Decision Lab study data",()=>{
  it("never treats a stale patch or client version as current tier evidence",()=>{
    expect(exactPatch("18.2b","18.6",true)).toBe(false);
    expect(exactPatch("18.6","18.6",false)).toBe(false);
    expect(exactPatch("18.6","18.6",true)).toBe(true);
    expect(exactPatch(undefined,"18.6",true)).toBe(false);
  });
  it("uses only compatible completed items and known profiles",()=>{
    const items=[item("Guinsoo's Rageblade"),item("Rabadon's Deathcap"),item("Guinsoo's Rageblade","component")];
    expect(carryStudy(champion("Xayah",3),items).map(x=>x.item.name)).toEqual(["Guinsoo's Rageblade"]);
    expect(carryStudy(champion("Unknown",4),items)).toEqual([]);
  });
  it("does not include expensive units in early holders",()=>{
    expect(earlyHolders(item("Guinsoo's Rageblade"),[champion("Xayah",3),champion("Caitlyn",1)]).map(x=>x.champion.name)).toEqual(["Caitlyn"]);
  });
});
