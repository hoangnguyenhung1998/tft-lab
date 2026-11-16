import type { MatchDto } from "./riot/types";
import type { MetaFile } from "./meta";

export function clientPatch(version: string | undefined): string | null {
  if (!version) return null;
  const m = version.match(/^(?:Version\s+)?(\d+)\.(\d+)(?:[.\s(]|$)/i);
  return m ? Number(m[1])+"."+Number(m[2]) : null;
}
export function selectPatchMatches(matches: MatchDto[], set: number, patch: string): MatchDto[] {
  const wanted=clientPatch(patch);
  if (!wanted) return [];
  const seen=new Set<string>();
  return matches.filter(m=>{
    const id=m.metadata?.match_id;
    const valid=!!id && !seen.has(id) && (m.info.queue_id??m.info.queueId)===1100 && m.info.tft_set_number===set && clientPatch(m.info.game_version)===wanted && m.info.participants.length===8 && m.info.participants.every(p=>Number.isInteger(p.placement)&&p.placement>=1&&p.placement<=8) && new Set(m.info.participants.map(p=>p.placement)).size===8;
    if(valid) seen.add(id);
    return valid;
  });
}
export const MIN_MATCHES=30;
export function usableMeta(meta: MetaFile|null, set:number, patch:string): MetaFile|null {
  if(!meta || meta.schemaVersion!==2 || meta.set!==set || !clientPatch(patch) || clientPatch(meta.patch)!==clientPatch(patch) || meta.matches<MIN_MATCHES || meta.players!==meta.matches*8 || !Number.isFinite(Date.parse(meta.syncedAt)) || !Array.isArray(meta.comps) || !Array.isArray(meta.items) || !Array.isArray(meta.units)) return null;
  return meta;
}
