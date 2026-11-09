import Link from "next/link";
import { LogoMark } from "@/components/ui/Glyphs";
import { CURRENT_SET, isSynced } from "@/lib/current-set";
import { setDisplayName } from "@/lib/set-meta";
import { livePatch } from "@/lib/live-patch";

export const RIOT_DISCLAIMER =
  "TFT Lab isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Mùa giải",
    links: [
      { href: "/set/comps", label: "Xếp hạng đội hình" },
      { href: "/set/champions", label: "Tướng" },
      { href: "/set/traits", label: "Tộc hệ" },
      { href: "/set/items", label: "Trang bị" },
      { href: "/set/augments", label: "Lõi nâng cấp" },
      { href: "/set/wisps", label: "Bùa" },
      { href: "/set/patch-notes", label: "Bản cập nhật" },
    ],
  },
  {
    title: "Luyện kỹ năng",
    links: [
      { href: "/guides", label: "Hướng dẫn" },
      { href: "/trainer", label: "Luyện tập" },
      { href: "/trainer/daily", label: "10 bài mỗi ngày" },
      { href: "/trainer/puzzles", label: "Câu đố" },
      { href: "/routine", label: "Lộ trình" },
      { href: "/tracker", label: "Nhật ký trận" },
    ],
  },
  {
    title: "Công cụ",
    links: [
      { href: "/lab/board", label: "Xếp đội hình" },
      { href: "/lab/odds", label: "Tỷ lệ roll" },
      { href: "/lab/econ", label: "Mô phỏng kinh tế" },
      { href: "/lab/cheatsheet", label: "Bảng ghi nhớ" },
      { href: "/compete", label: "Thi đấu" },
      { href: "/resources", label: "Tài nguyên" },
    ],
  },
];

export function Footer() {
  const patch = livePatch();
  const synced = isSynced() ? new Date(CURRENT_SET.syncedAt) : null;
  const setName = isSynced() ? setDisplayName(CURRENT_SET.setNumber, CURRENT_SET.setName) : null;
  return (
    <footer className="site-footer no-print">
      <div className="site-footer-inner">
        <div className="gold-rule mb-8" />
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="display flex items-center gap-2 text-lg font-bold tracking-widest text-gold-bright hover:no-underline">
              <LogoMark />
              TFT LAB
            </Link>
            <p className="mt-3 max-w-xs text-sm text-dim">Đội hình, dữ liệu mùa giải, bản cập nhật, bài luyện và công cụ TFT. Dữ liệu được đồng bộ theo bản vá.</p>
            {synced ? (
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-dim">
                <dt className="display uppercase tracking-[0.15em] text-gold">Mùa</dt>
                <dd>
                  {CURRENT_SET.setNumber} · {setName}
                </dd>
                <dt className="display uppercase tracking-[0.15em] text-gold">Bản vá</dt>
                <dd>
                  {patch.label}
                  {patch.publishedAt ? ` · notes ${patch.publishedAt.slice(0, 10)}` : ""}
                </dd>
                <dt className="display uppercase tracking-[0.15em] text-gold">Dữ liệu</dt>
                <dd>
                  <time dateTime={synced.toISOString()}>{synced.toISOString().slice(0, 10)}</time> · CommunityDragon
                </dd>
              </dl>
            ) : null}
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <div className="display text-[0.68rem] uppercase tracking-[0.2em] text-gold">{c.title}</div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-ink hover:text-gold-bright">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t border-[var(--gold-dim)] pt-5 text-xs text-dim">
          <p className="max-w-3xl">{RIOT_DISCLAIMER}</p>
          <p className="mt-3">
            Dữ liệu trò chơi từ{" "}
            <a href="https://communitydragon.org" rel="noopener noreferrer" target="_blank">
              CommunityDragon
            </a>{" "}
            và{" "}
            <a href="https://developer.riotgames.com/docs/lol#data-dragon" rel="noopener noreferrer" target="_blank">
              Riot Data Dragon
            </a>
            ; ghi chú bản vá từ{" "}
            <a href="https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/" rel="noopener noreferrer" target="_blank">
              Riot&apos;s game updates
            </a>
            ; hình ảnh Linh Thú từ CommunityDragon. Nguồn tham khảo tại <Link href="/resources">Tài nguyên</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}
