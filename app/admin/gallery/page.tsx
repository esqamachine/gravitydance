import { getGalleryImages } from "@/lib/queries";
import GalleryAdmin from "@/components/admin/GalleryAdmin";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const images = await getGalleryImages();
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
        Загруженные фото показываются в секции «Галерея» на главной странице
        сайта. Новые — сверху.
      </p>
      <GalleryAdmin images={images} />
    </div>
  );
}
