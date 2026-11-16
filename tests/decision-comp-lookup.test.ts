import {describe,it,expect} from "vitest";
import {filterComps} from "@/lib/decision/comp-lookup";
import type {Comp} from "@/lib/comps";
const c={id:"a",style:"reroll",carries:[{championId:"u",items:["i"]}],augments:[{augmentId:"a"}],board:[]} as unknown as Comp;
describe("comp reference filters",()=>{it("combines exact reference matches",()=>{expect(filterComps([c],{item:"i",augment:"a",carry:"u",style:"reroll"})).toEqual([c]);expect(filterComps([c],{item:"i",augment:"other",carry:"u",style:"reroll"})).toEqual([]);});});
