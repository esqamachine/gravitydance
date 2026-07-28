/**
 * Плейсхолдер-изображение.
 * Легко заменяется на <Image src="..." /> позже.
 * Брендовый градиент, подпись/эмодзи.
 */
export default function Placeholder({
  label = "Фото",
  className = "",
  ratio,
}: {
  label?: string;
  className?: string;
  ratio?: string; // напр. "aspect-[3/4]"
}) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-primary/25 via-violet/20 to-pink/20 text-ink/70 ring-1 ring-white/10 ${
        ratio ?? ""
      } ${className}`}
    >
      <span className="font-heading text-sm font-medium uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
