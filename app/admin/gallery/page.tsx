import fs from "fs";
import path from "path";
import { getGalleryImages } from "@/lib/queries";
import GalleryAdmin from "@/components/admin/GalleryAdmin";
import { requireAdmin } from "@/lib/account";

export const dynamic = "force-dynamic";

/** Статические фото сайта из public/images/gallery. */
function siteGalleryUrls(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "images", "gallery");
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort()
      .map((f) => `/images/gallery/${f}`);
  } catch {
    return [];
  }
}

export default async function AdminGalleryPage() {
  await requireAdmin();
  const images = await getGalleryImages();
  const siteUrls = siteGalleryUrls();
  const haveUrls = new Set(images.map((i) => i.image_url));
  const notImported = siteUrls.filter((u) => !haveUrls.has(u));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          <span className="text-gradient">Галерея</span>
        </h1>
        <span className="font-body text-sm text-muted">
          Фото: {images.length}
        </span>
      </div>
      <p className="font-body text-sm text-muted">
        Фото из галереи показываются в секции «Галерея» на главной странице
        сайта. Новые — сверху. Статические фото сайта можно импортировать, чтобы
        удалять и заменять их.
      </p>
      <GalleryAdmin
        images={images}
        siteUrls={siteUrls}
        notImportedCount={notImported.length}
      />
    </div>
  );
}
