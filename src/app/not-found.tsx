import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="shell-panel max-w-lg rounded-3xl border border-line p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">404</p>
        <h1 className="mt-3 text-4xl text-foreground">Vista no disponible</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          La pantalla que buscas no existe o fue movida.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-strong"
        >
          Volver al dashboard
        </Link>
      </div>
    </main>
  );
}
