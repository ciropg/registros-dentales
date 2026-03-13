"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

const labels = {
  es: {
    title: "Idioma",
    spanish: "ES",
    english: "EN",
    selected: "Actual",
  },
  en: {
    title: "Language",
    spanish: "ES",
    english: "EN",
    selected: "Current",
  },
} as const;

export function LanguageSwitcher({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const copy = labels[locale];
  const redirectTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  return (
    <div
      className={cn("shell-panel notranslate rounded-full border border-line bg-white/85 p-1 shadow-sm", className)}
      translate="no"
    >
      <div className="flex items-center gap-1">
        <span className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          {copy.title}
        </span>
        {(["es", "en"] as const).map((value) => {
          const isActive = locale === value;

          return (
            <a
              key={value}
              href={`/locale?lang=${value}&redirectTo=${encodeURIComponent(redirectTo)}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition",
                isActive ? "bg-brand text-brand-ink" : "text-foreground hover:bg-white",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-2 w-2 rounded-full transition",
                  isActive ? "bg-current opacity-100" : "bg-transparent opacity-0",
                )}
              />
              <span>{value === "es" ? copy.spanish : copy.english}</span>
              {isActive ? <span className="sr-only">{copy.selected}</span> : null}
            </a>
          );
        })}
      </div>
    </div>
  );
}
