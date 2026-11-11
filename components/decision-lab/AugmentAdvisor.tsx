"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import type { Augment, Champion, Item } from "@/lib/types";
import type { BoardState } from "@/lib/decision/item-advisor";
import { compareAugments, type AugmentStage } from "@/lib/decision/augment-advisor";

type StageRecord = { offers: string[]; chosen: string };
type MatchState = Record<AugmentStage, StageRecord>;
type Props = {
  augments: Augment[];
  patch: string;
  board: BoardState;
  holder?: Champion;
  equipped?: Item;
  components: Item[];
};

const STAGES: AugmentStage[] = ["2-1", "3-2", "4-2"];
const blank = (): MatchState => ({
  "2-1": { offers: ["", "", ""], chosen: "" },
  "3-2": { offers: ["", "", ""], chosen: "" },
  "4-2": { offers: ["", "", ""], chosen: "" },
});
const tierName = { silver: "Bạc", gold: "Vàng", prismatic: "Kim Cương" };
const isStage = (value: unknown): value is AugmentStage => STAGES.includes(value as AugmentStage);

function validateHistory(raw: unknown, validIds: Set<string>): MatchState {
  const result = blank();
  if (!raw || typeof raw !== "object") return result;
  for (const stage of STAGES) {
    const entry = (raw as Record<string, unknown>)[stage];
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const offers = obj.offers;
    if (Array.isArray(offers)) {
      result[stage].offers = [0, 1, 2].map((index) => {
        const value: unknown = offers[index];
        return typeof value === "string" && validIds.has(value) ? value : "";
      });
    }
    if (typeof obj.chosen === "string" && result[stage].offers.includes(obj.chosen)) result[stage].chosen = obj.chosen;
  }
  return result;
}

export function AugmentAdvisor({ augments, patch, board, holder, equipped, components }: Props) {
  const [stage, setStage] = useState<AugmentStage>("2-1");
  const [history, setHistory] = useState<MatchState>(blank);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState(["", "", ""]);
  const [health, setHealth] = useState("");
  const [gold, setGold] = useState("");
  const [tier, setTier] = useState("");
  const storageKey = "tft-decision-augments-v2-" + patch;
  const byId = useMemo(() => new Map(augments.map((a) => [a.id, a])), [augments]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setHistory(validateHistory(JSON.parse(stored) as unknown, new Set(augments.map((a) => a.id))));
    } catch {
      // Local storage can be disabled; use an in-memory session instead.
    }
    setReady(true);
  }, [storageKey, augments]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(history)); } catch { /* optional persistence */ }
  }, [ready, storageKey, history]);

  const record = history[stage];
  const picked = record.offers.map((id) => byId.get(id)).filter((a): a is Augment => !!a);
  const previous = STAGES.slice(0, STAGES.indexOf(stage))
    .map((s) => byId.get(history[s].chosen)).filter((a): a is Augment => !!a);
  const assessments = compareAugments(picked, {
    stage, board, holder, equipped: equipped ? [equipped] : [],
    components, health: health === "" ? undefined : Number(health),
    gold: gold === "" ? undefined : Number(gold), previous,
  });
  const incomplete = picked.length < 3;
  const maxScore = assessments[0]?.score ?? 0;
  const secondScore = assessments[1]?.score ?? 0;
  const close = assessments.length > 1 && maxScore - secondScore < 8;
  const cannotRank = incomplete || close || assessments.every((a) => a.evidence === "limited");

  function updateRecord(mutator: (entry: StageRecord) => StageRecord) {
    setHistory((prev) => ({ ...prev, [stage]: mutator(prev[stage]) }));
  }
  function offerChange(index: number, id: string) {
    updateRecord((entry) => {
      const offers = [...entry.offers];
      offers[index] = id;
      return { offers, chosen: offers.includes(entry.chosen) ? entry.chosen : "" };
    });
  }
  function selectStage(next: AugmentStage) {
    if (!isStage(next)) return;
    setStage(next);
    setSearch(["", "", ""]);
    setTier("");
  }
  function clearMatch() {
    setHistory(blank());
    setStage("2-1");
    setSearch(["", "", ""]);
    setGold("");
    setHealth("");
    setTier("");
  }

  const inputClass = "w-full min-w-0 rounded-lg border border-gold/30 bg-panel px-3 py-2 text-sm";
  return (
    <section className="panel space-y-5 p-4 sm:p-5" aria-labelledby="augment-advisor-title">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">V2.0 · Không gọi AI</p>
        <h2 id="augment-advisor-title" className="mt-1 text-xl font-semibold">Tư vấn lõi nâng cấp</h2>
        <p className="mt-2 text-sm text-dim">
          Nhập đúng 3 lõi xuất hiện trong game ở từng mốc. Công cụ giải thích theo mô tả lõi,
          đồ hiện có, tướng giữ đồ và sức mạnh board — không phải tỷ lệ thắng.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Mốc chọn lõi">
        {STAGES.map((value) => (
          <button key={value} type="button" aria-pressed={stage === value}
            className={"btn btn-sm " + (stage === value ? "btn-primary" : "")}
            onClick={() => selectStage(value)}>
            {value}{history[value].chosen ? " ✓" : ""}
          </button>
        ))}
        <button type="button" className="btn btn-sm ml-auto" onClick={clearMatch}>Trận mới / Xóa</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="augment-health" className="mb-1 block text-xs text-dim">Máu hiện tại (tùy chọn)</label>
          <input id="augment-health" className={inputClass} type="number" min="0" max="100"
            value={health} onChange={(e) => setHealth(e.target.value)} placeholder="VD: 68" />
        </div>
        <div>
          <label htmlFor="augment-gold" className="mb-1 block text-xs text-dim">Vàng hiện tại (tùy chọn)</label>
          <input id="augment-gold" className={inputClass} type="number" min="0" max="999"
            value={gold} onChange={(e) => setGold(e.target.value)} placeholder="VD: 42" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="augment-tier" className="text-xs text-dim">Lọc độ hiếm để tìm nhanh:</label>
        <select id="augment-tier" className="rounded-lg border border-gold/30 bg-panel px-3 py-2 text-sm"
          value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="silver">Bạc</option><option value="gold">Vàng</option><option value="prismatic">Kim Cương</option>
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((index) => {
          const selected = byId.get(record.offers[index]);
          const results = augments.filter((augment) => (!tier || augment.tier === tier)
            && (!search[index] || (augment.name + " " + augment.desc).toLowerCase().includes(search[index].toLowerCase())))
            .filter((augment) => augment.id === record.offers[index] || !record.offers.some((id, idx) => idx !== index && id === augment.id))
            .sort((a, b) => a.name.localeCompare(b.name)).slice(0, 100);
          return (
            <div key={index} className="rounded-xl border border-gold/30 p-3">
              <p className="mb-2 text-sm font-semibold text-gold">Lõi {index + 1}</p>
              <label htmlFor={"augment-search-" + index} className="sr-only">Tìm lõi {index + 1}</label>
              <input id={"augment-search-" + index} value={search[index]} onChange={(e) => setSearch((prev) => prev.map((v,i) => i === index ? e.target.value : v))}
                className={inputClass + " mb-2"} placeholder="Tìm tên lõi..." />
              <label htmlFor={"augment-choice-" + index} className="sr-only">Lõi {index + 1} trong game</label>
              <select id={"augment-choice-" + index} className={inputClass}
                value={record.offers[index]} onChange={(e) => offerChange(index, e.target.value)}>
                <option value="">Chọn lõi...</option>
                {selected && !results.some((a) => a.id === selected.id) ? (
                  <option value={selected.id}>{selected.name} ({tierName[selected.tier]})</option>
                ) : null}
                {results.map((a) => <option key={a.id} value={a.id}>{a.name} · {tierName[a.tier]}</option>)}
              </select>
              {selected ? <div className="mt-3 flex gap-2">
                {selected.icon ? <Image src={asset(selected.icon)} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded object-contain" /> : null}
                <div className="min-w-0"><p className="text-sm font-semibold">{selected.name}</p><p className="mt-1 text-xs leading-relaxed text-dim">{selected.desc}</p></div>
              </div> : null}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold">So sánh theo tình huống ở {stage}</h3>
        {incomplete ? <p className="text-xs text-dim">Anh có thể xem đánh giá từng lõi ngay. Nhập đủ ba lõi để so sánh trực tiếp.</p> : null}
        {cannotRank && assessments.length > 1 ? <p className="text-xs text-gold">Chưa đủ độ chênh lệch hoặc tín hiệu để kết luận một lõi chắc chắn tốt nhất. Hãy đọc điều kiện và rủi ro của từng lõi.</p> : null}
        {!assessments.length ? <p className="rounded-lg border border-gold/25 p-3 text-sm text-dim">Chưa chọn lõi. Chọn mốc 2-1, 3-2 hoặc 4-2 và nhập ba lựa chọn trong game.</p> : null}
        {assessments.map((result, index) => (
          <div key={result.augment.id} className="rounded-xl border border-gold/30 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{result.augment.name} <span className="text-xs text-dim">· {tierName[result.augment.tier]}</span></p>
              <span className="text-xs text-gold">{result.categoryLabel} · {index === 0 && !cannotRank ? "Ưu tiên xem xét" : "Phương án"}</span>
            </div>
            <p className="mt-2 text-sm">{result.benefits.join(" ")}</p>
            {result.risks.length ? <p className="mt-2 text-xs text-dim">Cần lưu ý: {result.risks.join(" ")}</p> : null}
            {result.evidence === "limited" ? <p className="mt-2 text-xs text-gold">Thiếu dữ liệu để khuyên chọn chắc chắn; đọc kỹ điều kiện kích hoạt.</p> : null}
            <button type="button" onClick={() => updateRecord((entry) => ({ ...entry, chosen: result.augment.id }))}
              className={"btn btn-sm mt-3 " + (record.chosen === result.augment.id ? "btn-primary" : "")}
              aria-pressed={record.chosen === result.augment.id}>
              {record.chosen === result.augment.id ? "Đã chọn ✓" : "Tôi chọn lõi này"}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gold/25 p-3 text-xs text-dim">
        <p className="font-semibold text-ink">Lịch sử lõi trong trận</p>
        {STAGES.map((s) => <p key={s} className="mt-1">{s}: {byId.get(history[s].chosen)?.name ?? "Chưa chọn"}</p>)}
        <p className="mt-2">Lưu trên trình duyệt hiện tại theo phiên bản dữ liệu. Không đồng bộ giữa máy hoặc tài khoản. Quy tắc chỉ tư vấn, không tự suy luận chuỗi thắng/thua theo loại lõi.</p>
      </div>
    </section>
  );
}
