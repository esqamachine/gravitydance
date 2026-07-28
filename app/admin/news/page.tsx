import { getAllNews } from "@/lib/queries";
import NewsAdmin from "@/components/admin/NewsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const news = await getAllNews();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          <span className="text-gradient">Новости</span>
        </h1>
        <span className="font-body text-sm text-muted">
          Всего: {news.length}
        </span>
      </div>
      <NewsAdmin news={news} />
    </div>
  );
}
