import { getMessages } from "@/lib/i18n/messages";
import { getCurrentLocale } from "@/lib/i18n/server";

export default async function Loading() {
  const locale = await getCurrentLocale();
  const copy = getMessages(locale);

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="shell-panel rounded-3xl border border-line px-8 py-6 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">{copy.loading.eyebrow}</p>
        <h1 className="mt-3 text-2xl text-foreground">{copy.loading.title}</h1>
      </div>
    </main>
  );
}
