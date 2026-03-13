import Link from "next/link";
import { logoutAction } from "@/modules/auth/actions";
import { NavLink } from "@/components/layout/nav-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";

export function Sidebar({
  user,
  locale,
}: {
  user: {
    name: string;
    roleLabel: string;
    environmentLabel: string;
    isDemo: boolean;
    canManageUsers: boolean;
  };
  locale: Locale;
}) {
  const copy = getMessages(locale);

  return (
    <aside className="shell-panel grid-bg flex min-h-full flex-col rounded-[2rem] border border-line p-5">
      <Link href="/dashboard" className="rounded-3xl bg-brand px-5 py-5 text-brand-ink">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-ink/70">{copy.sidebar.brandEyebrow}</p>
        <h1 className="mt-3 text-3xl">{copy.sidebar.brandTitle}</h1>
        <p className="mt-2 text-sm text-brand-ink/80">{copy.sidebar.brandDescription}</p>
      </Link>

      <nav className="mt-6 grid gap-2">
        <NavLink href="/dashboard" label={copy.sidebar.dashboard} />
        <NavLink href="/patients" label={copy.sidebar.patients} />
        <NavLink href="/appointments" label={copy.sidebar.appointments} />
        {user.canManageUsers ? <NavLink href="/users" label={copy.sidebar.users} /> : null}
      </nav>

      <div className="mt-auto rounded-3xl border border-line bg-white/60 p-4">
        <p className="text-sm font-semibold text-foreground">{user.name}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="brand">{user.roleLabel}</Badge>
          <Badge tone={user.isDemo ? "warning" : "neutral"}>
            {user.environmentLabel}
          </Badge>
        </div>
        <form action={logoutAction} className="mt-4">
          <Button type="submit" variant="secondary" className="w-full">
            {copy.sidebar.logout}
          </Button>
        </form>
      </div>
    </aside>
  );
}
