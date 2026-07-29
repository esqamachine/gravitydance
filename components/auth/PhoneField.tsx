"use client";

/** Форматирует до 10 цифр в маску «(999) 999-99-99». */
function formatTen(d: string): string {
  d = d.replace(/\D/g, "").slice(0, 10);
  let out = "";
  if (d.length > 0) out += "(" + d.slice(0, 3);
  if (d.length >= 3) out += ") " + d.slice(3, 6);
  if (d.length >= 6) out += "-" + d.slice(6, 8);
  if (d.length >= 8) out += "-" + d.slice(8, 10);
  return out;
}

/**
 * Поле телефона: «+7» предзаполнено и не редактируется, пользователь вводит
 * только 10 цифр. Наружу отдаёт сырые цифры (до 10) через onChange.
 */
export default function PhoneField({
  digits,
  onChange,
  placeholder = "(999) 999-99-99",
  autoComplete = "tel",
}: {
  digits: string;
  onChange: (d: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex min-h-[50px] items-stretch rounded-xl border border-white/10 bg-surface transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
      <span className="flex select-none items-center pl-4 pr-1 font-body text-base text-ink">
        +7
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={formatTen(digits)}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 10))
        }
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full min-w-0 rounded-r-xl bg-transparent py-3 pr-4 text-base font-body text-ink placeholder-muted/60 outline-none"
      />
    </div>
  );
}
