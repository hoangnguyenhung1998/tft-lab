"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";
import type { Champion, Item } from "@/lib/types";
import { adviseItems, recipesForComponents, remainingComponents, type BoardState } from "@/lib/decision/item-advisor";

type Props = { champions: Champion[]; items: Item[] };

function Icon({ src, alt }: { src: string; alt: string }) {
  return src ? <Image src={asset(src)} width={38} height={38} alt={alt} className="h-9 w-9 shrink-0 rounded object-contain" unoptimized /> : null;
}

export function DecisionLab({ champions, items }: Props) {
  const components = useMemo(() => items.filter((i) => i.kind === "component").sort((a, b) => a.name.localeCompare(b.name)), [items]);
  const [selection, setSelection] = useState<string[]>([]);
  const [holderId, setHolderId] = useState("");
  const [boardState, setBoardState] = useState<BoardState>("even");
  const [activeItem, setActiveItem] = useState("");
  const [query, setQuery] = useState("");
  const [cost, setCost] = useState<number>(0);
  const [showAll, setShowAll] = useState(false);
  const lookup = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const options = useMemo(() => adviseItems({ items, champions, components: selection, holderId, boardState }), [items, champions, selection, holderId, boardState]);
  const selected = options.find((o) => o.item.id === activeItem) ?? options[0];
  const candidates = useMemo(() => (selected?.transfers ?? []).filter((c) => !cost || c.champion.cost === cost).filter((c) => c.champion.name.toLowerCase().includes(query.trim().toLowerCase())), [selected, cost, query]);
  const grouped = [3, 4, 5].map((tier) => ({ tier, matches: candidates.filter((x) => x.champion.cost === tier).slice(0, showAll ? 40 : 5) }));
  const remaining = selected ? remainingComponents(selection, selected.using) : selection;
  const remainingItems = remaining.map((id) => lookup.get(id)).filter((i): i is Item => !!i);

  const componentLabels = Object.fromEntries(components.map((component) => [component.id, component.name]));
  const existing = new Set(recipesForComponents(items, remaining).map((r) => r.item.id));
  const shopping = selected ? components.map((component) => {
    const possible = recipesForComponents(items, [...remaining, component.id])
      .filter((r) => !existing.has(r.item.id))
      .map((r) => r.item);
    return { component, matches: possible };
  }).filter((x) => x.matches.length > 0)
    .sort((a, b) => b.matches.length - a.matches.length || a.component.name.localeCompare(b.component.name))
    .slice(0, 6) : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="panel space-y-5 p-4 sm:p-5" aria-label="Nhập tình huống">
        <div>
          <h2 className="text-lg font-semibold">1. Mảnh đồ đang có</h2>
          <p className="mt-1 text-xs text-dim">Bấm để thêm mảnh, bấm lại mảnh đã chọn để bỏ. Có thể chọn trùng mảnh.</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {components.map((c) => (
            <button type="button" key={c.id} disabled={selection.length >= 8} onClick={() => setSelection((prev) => [...prev, c.id])}
              title={"Thêm " + c.name} className="flex min-w-0 flex-col items-center gap-1 rounded-lg border border-gold/25 p-2 transition hover:border-gold disabled:opacity-40">
              <Icon src={c.icon} alt="" /><span className="line-clamp-2 text-center text-[0.65rem] leading-tight">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selection.map((id, i) => {
            const c = lookup.get(id);
            return c ? <button type="button" key={i} onClick={() => setSelection((prev) => prev.filter((_, j) => j !== i))}
              title={"Bỏ " + c.name} className="flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-2 py-1 text-xs">
              <Icon src={c.icon} alt="" /> {c.name} <span aria-hidden>×</span>
            </button> : null;
          })}
          {!selection.length ? <span className="text-xs text-dim">Chưa chọn mảnh đồ.</span> : null}
          {selection.length ? <button type="button" className="btn btn-sm" onClick={() => { setSelection([]); setActiveItem(""); }}>Xóa hết</button> : null}
        </div>

        <div>
          <label htmlFor="decision-holder" className="mb-2 block text-sm font-medium">2. Tướng đang giữ đồ (không bắt buộc)</label>
          <select id="decision-holder" value={holderId} onChange={(e) => setHolderId(e.target.value)}
            className="w-full rounded-lg border border-gold/25 bg-panel p-3 text-sm">
            <option value="">Chưa có tướng giữ đồ</option>
            {[1, 2, 3, 4, 5].map((tier) => (
              <optgroup label={tier + " vàng"} key={tier}>
                {champions.filter((c) => c.cost === tier).sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="decision-board" className="mb-2 block text-sm font-medium">3. Sức mạnh board</label>
          <select id="decision-board" className="w-full rounded-lg border border-gold/25 bg-panel p-3 text-sm"
            value={boardState} onChange={(e) => setBoardState(e.target.value as BoardState)}>
            <option value="strong">Mạnh — có thể giữ chuỗi thắng</option>
            <option value="even">Trung bình — thắng thua xen kẽ</option>
            <option value="weak">Yếu — mất máu nhanh</option>
          </select>
          <p className="mt-2 text-xs text-dim">Đánh giá qua giao tranh và scout đối thủ; không suy từ lõi kinh tế/trang bị.</p>
        </div>
      </section>

      <section className="panel min-w-0 space-y-4 p-4 sm:p-5" aria-label="Khuyến nghị">
        <div>
          <h2 className="text-lg font-semibold">Công thức & đường chuyển</h2>
          <p className="text-xs text-dim">Công thức ghép từ dữ liệu game; đường chuyển chỉ hiện các carry có hồ sơ cơ chế. Không phải bảng đồ BIS.</p>
        </div>
        {options.length ? (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((o) => (
                <button type="button" key={o.item.id} onClick={() => { setActiveItem(o.item.id); setCost(0); setQuery(""); }}
                  aria-pressed={selected?.item.id === o.item.id}
                  className={"flex items-center gap-3 rounded-xl border p-3 text-left transition " + (selected?.item.id === o.item.id ? "border-gold bg-gold/10" : "border-gold/25 hover:border-gold/40")}>
                  <Icon src={o.item.icon} alt="" />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{o.item.name}</span>
                    <span className="block text-[0.7rem] text-dim">{o.transfers.filter((t) => t.fit >= 80).length} carry phù hợp rõ · {o.advice === "slam" ? "Có thể ghép" : o.advice === "hold" ? "Nên giữ mảnh" : "Cân nhắc"}</span>
                  </span>
                </button>
              ))}
            </div>
            {selected ? <div className="space-y-4 rounded-xl border border-gold/30 bg-gold/5 p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Icon src={selected.item.icon} alt="" />
                <div>
                  <h3 className="font-semibold">{selected.item.name}</h3>
                  <p className="text-xs text-dim">{selected.using.map((id) => componentLabels[id] ?? id).join(" + ")}</p>
                </div>
              </div>
              <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wide text-gold">{selected.advice === "slam" ? "Có thể ghép để giữ máu" : selected.advice === "hold" ? "Chưa nên ghép cho holder này" : "Cân nhắc theo sức mạnh board"}</p><p className="text-sm">{selected.reason}</p></div>
              {selected.holderFit !== null ? <p className="text-xs text-dim">Mức tương thích người giữ đồ (ước lượng theo vai trò): {selected.holderFit >= 80 ? "Có cơ chế phù hợp" : selected.holderFit >= 55 ? "Có thể dùng tạm" : selected.holderFit === 0 ? "Chưa đủ dữ liệu" : "Không phù hợp theo hồ sơ hiện có"}.</p> : null}
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor="decision-tier">Lọc bậc tướng</label>
                <select id="decision-tier" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="rounded-lg border border-gold/25 bg-panel p-2 text-sm">
                  <option value={0}>Tất cả 3–5 vàng</option>
                  <option value={3}>3 vàng</option><option value={4}>4 vàng</option><option value={5}>5 vàng</option>
                </select>
                <label className="sr-only" htmlFor="decision-query">Tìm tướng</label>
                <input id="decision-query" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm carry..." className="min-w-0 flex-1 rounded-lg border border-gold/25 bg-panel px-3 py-2 text-sm" />
              </div>
              {grouped.map(({ tier, matches }) => matches.length ? <div key={tier}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">Carry {tier} vàng</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {matches.map((m) => (
                    <div key={m.champion.id} className="flex items-start gap-2 rounded-lg border border-gold/25 p-2">
                      <Icon src={m.champion.icon} alt="" />
                      <div><p className="text-sm font-semibold">{m.champion.name}</p><p className="text-xs text-dim">{m.fit >= 80 ? "Hợp cơ chế · " : "Tùy tình huống · "}{m.reason}</p></div>
                    </div>
                  ))}
                </div>
              </div> : null)}
              {!candidates.length ? <p className="text-xs text-dim">Chưa có tướng phù hợp theo bộ lọc. Không nên chốt bài từ món đồ này.</p> : null}
              {selected.transfers.length > 5 ? <button className="btn btn-sm" type="button" onClick={() => setShowAll((v) => !v)}>{showAll ? "Thu gọn" : "Xem thêm carry"}</button> : null}
              <p className="text-xs text-dim">{selected.caution}</p>
            </div> : null}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Đi chợ: mảnh để hoàn thiện đồ tiếp theo</h3>
              <p className="text-xs text-dim">Sau khi ghép {selected?.item.name}, còn {remainingItems.length} mảnh. Các mảnh dưới đây mở ra nhiều công thức nhất với đồ còn lại; chưa xét đội hình và đối thủ.</p>
              {remainingItems.length ? <div className="flex flex-wrap gap-2">{remainingItems.map((i, idx) => <span key={idx} className="rounded border border-gold/25 px-2 py-1 text-xs">{i.name}</span>)}</div> : <p className="text-xs text-dim">Chưa còn mảnh để ghép. Ưu tiên chọn đồ phù hợp với vai trò đang thiếu.</p>}
              {shopping.length ? <div className="grid gap-2 sm:grid-cols-2">
                {shopping.map(({ component, matches }) => component ? <div key={component.id} className="flex items-start gap-2 rounded-lg border border-gold/25 p-2">
                  <Icon src={component.icon} alt="" />
                  <div><p className="text-sm font-semibold">{component.name}</p><p className="text-xs text-dim">{matches.slice(0, 3).map((m) => m.name).join(" · ")}</p></div>
                </div> : null)}
              </div> : null}
            </div>
          </>
        ) : <div className="rounded-xl border border-gold/25 p-4 text-sm text-dim">
          Chọn ít nhất hai mảnh để xem công thức. Nếu có hai mảnh giống nhau, hãy chọn cùng mảnh hai lần.
        </div>}
        <div className="rounded-lg border border-gold/25 p-3 text-xs text-dim">
          <strong className="text-ink">Lưu ý:</strong> Những carry chưa được thẩm định sẽ không được đề xuất, thay vì tự động suy luận theo tầm đánh hoặc AP phụ. Đường chuyển chưa phản ánh tỷ lệ thắng, độ tranh bài, điều kiện mở khóa hay sức mạnh của patch. Hãy kiểm tra kỹ năng, lõi và lobby trước khi quyết định reroll/Fast 8/9.
        </div>
      </section>
    </div>
  );
}
