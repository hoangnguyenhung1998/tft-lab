import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Backdrop } from "@/components/layout/Backdrop";
import { BottomNav } from "@/components/layout/BottomNav";
import { SITE_URL } from "@/lib/site";

// Self-hosted variable fonts (app/fonts, latin subset, from Google Fonts).
// next/font/google fetches at build time and a transient Google outage failed
// a deploy on 2026-09-24; the automated redeploys must not depend on it.
const cinzel = localFont({
  src: "./fonts/cinzel-latin.woff2",
  variable: "--font-cinzel",
  weight: "400 900",
  display: "swap",
});

// Body text uses `optional`: on a slow connection the system fallback stays,
// which keeps the first paragraph (the LCP element on guide pages) from being
// re-painted late by the font swap. Headings keep `swap` because Cinzel is the look.
const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "optional",
});

const DESCRIPTION = "TFT Lab tiếng Việt: đội hình theo bản cập nhật, dữ liệu mùa giải, hướng dẫn, bài luyện ra quyết định, công cụ xếp đội hình và nhật ký trận đấu.";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: { default: "TFT Lab · Hướng dẫn, đội hình và luyện tập TFT", template: "%s · TFT Lab" },
  description: DESCRIPTION,
  applicationName: "TFT Lab",
  keywords: ["TFT", "Teamfight Tactics", "comps", "tier list", "meta", "patch notes", "augments", "items", "champions", "team planner"],
  openGraph: { type: "website", siteName: "TFT Lab", title: "TFT Lab", description: DESCRIPTION, locale: "vi_VN" },
  twitter: { card: "summary_large_image", title: "TFT Lab", description: DESCRIPTION },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, title: "TFT Lab", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#070b12",
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator; the header, main and bottom bar
  // pad with env(safe-area-inset-*) so nothing hides behind them in landscape.
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="antialiased flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-panel focus:px-3 focus:py-2">
          Chuyển đến nội dung
        </a>
        <Backdrop />
        <Header />
        <main id="main" className="site-main">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
