import {describe,it,expect} from "vitest";
import {clientPatch,selectPatchMatches,usableMeta} from "@/lib/meta-guard";
import type {MatchDto} from "@/lib/riot/types";
import type {MetaFile} from "@/lib/meta";
const match=(id:string,version:string,set=18,queue=1100)=>({metadata:{match_id:id},info:{game_version:version,tft_set_number:set,queue_id:queue,participants:Array.from({length:8},(_,i)=>({placement:i+1}))}} as MatchDto);
describe("meta patch safeguards",()=>{
 it("parses full client version, never invents patch",()=>{expect(clientPatch("Version 16.22.123.4 (Nov)")).toBe("16.22");expect(clientPatch("unknown")).toBeNull();});
 it("rejects old patch, wrong set, wrong queue and duplicates",()=>{expect(selectPatchMatches([match("a","16.22.1"),match("a","16.22.1"),match("b","16.21.1"),match("c","16.22.1",17),match("d","16.22.1",18,1090)],18,"16.22").map(m=>m.metadata.match_id)).toEqual(["a"]);});
 it("blocks old schema and insufficient data",()=>{const m={schemaVersion:2,set:18,patch:"16.22",matches:30,players:240,syncedAt:"2026-11-16T00:00:00Z",comps:[],items:[],units:[]} as unknown as MetaFile;expect(usableMeta(m,18,"16.22")).toBe(m);expect(usableMeta(m,18,"16.23")).toBeNull();expect(usableMeta({...m,schemaVersion:1},18,"16.22")).toBeNull();expect(usableMeta({...m,matches:29},18,"16.22")).toBeNull();});
});
