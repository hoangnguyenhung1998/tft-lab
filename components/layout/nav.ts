/**
 * Primary navigation, in order. Comps first: it is what most visitors come
 * for, so it gets the accent in the header and the first slot in the bottom
 * bar on phones. Plain data (no "use client") so server and client parts share it.
 */
export interface NavItem {
  href: string;
  label: string;
  /** accented in the header */
  hot?: boolean;
  /** short label for the phone bottom bar; omitted = not in the bar */
  short?: string;
  /** shown inline only on very wide screens; otherwise lives in the menu sheet */
  secondary?: boolean;
  glyph?: "comps" | "set" | "trainer" | "lab" | "guides" | "tracker" | "routine" | "compete" | "resources";
}

export const NAV: readonly NavItem[] = [
  { href: "/set/comps", label: "Đội hình", hot: true, short: "Đội hình", glyph: "comps" },
  { href: "/set", label: "Mùa giải", short: "Mùa", glyph: "set" },
  { href: "/trainer", label: "Luyện tập", short: "Luyện", glyph: "trainer" },
  { href: "/lab", label: "Công cụ", short: "Công cụ", glyph: "lab" },
  { href: "/guides", label: "Hướng dẫn", glyph: "guides" },
  { href: "/tracker", label: "Nhật ký trận", glyph: "tracker" },
  { href: "/routine", label: "Lộ trình", glyph: "routine", secondary: true },
  { href: "/compete", label: "Thi đấu", glyph: "compete", secondary: true },
  { href: "/resources", label: "Tài nguyên", glyph: "resources", secondary: true },
];

/** The item whose href is the longest prefix of the path, so /set/comps lights Comps, not Set. */
export function activeNavHref(pathname: string, items: readonly NavItem[] = NAV): string | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  let best: NavItem | null = null;
  for (const it of items) {
    if (clean === it.href || clean.startsWith(`${it.href}/`)) {
      if (!best || it.href.length > best.href.length) best = it;
    }
  }
  return best?.href ?? null;
}
