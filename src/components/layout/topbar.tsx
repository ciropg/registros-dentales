import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";

export function Topbar({
  title,
  description,
  action,
  locale = "es",
  eyebrow,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  locale?: Locale;
  eyebrow?: string;
}) {
  const copy = getMessages(locale);

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">{eyebrow ?? copy.topbar.eyebrow}</p>
        <h1 className="mt-2 text-4xl text-foreground">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
