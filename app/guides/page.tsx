import Link from "next/link";
import { PageTitle, Panel } from "@/components/ui/Panel";
import { guideSlugs, readGuide } from "@/lib/guide-sections";
import { CURRENT_SET, isSynced } from "@/lib/current-set";
import { setDisplayName } from "@/lib/set-meta";

export const metadata = { title: "Hướng dẫn TFT" };

const PILLARS: { id: string; title: string; blurb: string }[] = [
  { id: "economy", title: "Kinh tế & nhịp trận", blurb: "Quản lý vàng, kinh nghiệm, roll và cách đánh đổi giữa tích tiền với sức mạnh bàn." },
  { id: "board", title: "Đội hình & trang bị", blurb: "Ghép đồ, chọn lõi và xếp vị trí để chuyển lợi thế thành chiến thắng." },
  { id: "game", title: "Đọc tình huống trận đấu", blurb: "Scout, quản lý máu, kế hoạch từng giai đoạn và xoay bài theo bảy đối thủ." },
];

export default function GuidesPage() {
  const guides = guideSlugs()
    .map((slug) => ({ slug, ...(readGuide(slug)?.data as { title?: string; description?: string; pillar?: string; order?: number }) }))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return (
    <div>
      <PageTitle lede="Kiến thức nền tảng về TFT: không chỉ nên làm gì mà còn vì sao nên làm như vậy. Mỗi hướng dẫn có bài tập liên quan và câu hỏi tự đánh giá để áp dụng vào trận tiếp theo.">
        Hướng dẫn TFT
      </PageTitle>
      <div className="space-y-10">
        {PILLARS.map((p) => (
          <section key={p.id}>
            <div className="display text-[0.7rem] uppercase tracking-[0.2em] text-gold">{p.title}</div>
            <p className="mt-1 text-sm text-dim">{p.blurb}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {guides
                .filter((g) => g.pillar === p.id)
                .map((g) => (
                  <Link key={g.slug} href={`/guides/${g.slug}`} className="panel block p-4 hover:no-underline">
                    <div className="display text-base text-gold-bright">{g.title ?? g.slug}</div>
                    {g.description ? <p className="mt-1 text-xs text-dim">{g.description}</p> : null}
                  </Link>
                ))}
            </div>
          </section>
        ))}
        <Panel>
          <div className="display text-[0.7rem] uppercase tracking-[0.2em] text-gold">Theo mùa giải hiện tại</div>
          <h2 className="mt-1 text-lg">
            {isSynced() ? (
              <Link href="/set">
                Mùa {CURRENT_SET.setNumber} · {setDisplayName(CURRENT_SET.setNumber, CURRENT_SET.setName)}
              </Link>
            ) : (
              "Dữ liệu mùa giải chưa được đồng bộ"
            )}
          </h2>
          <p className="mt-1 text-sm text-dim">Tra cứu tướng, tộc hệ, trang bị, lõi và các ghi chú theo dữ liệu trò chơi mới nhất đã đồng bộ.</p>
        </Panel>
      </div>
    </div>
  );
}
