import Link from "next/link";
import { getMessages } from "@/lib/i18n/messages";
import { getCurrentLocale } from "@/lib/i18n/server";

export default async function NotFound() {
  const locale = await getCurrentLocale();
  const copy = getMessages(locale);

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="shell-panel max-w-lg rounded-3xl border border-line p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">404</p>
        <h1 className="mt-3 text-4xl text-foreground">{copy.notFound.title}</h1>
        <p className="mt-4 text-sm leading-6 text-muted">{copy.notFound.description}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-strong"
        >
          {copy.notFound.back}
        </Link>
      </div>
    </main>
  );
}
