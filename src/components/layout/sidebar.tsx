import Link from "next/link";
import { logoutAction } from "@/modules/auth/actions";
import { NavLink } from "@/components/layout/nav-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Sidebar({
  user,
}: {
  user: {
    name: string;
    roleLabel: string;
    environmentLabel: string;
    canManageUsers: boolean;
  };
}) {
  return (
    <aside className="shell-panel grid-bg flex min-h-full flex-col rounded-[2rem] border border-line p-5">
      <Link href="/dashboard" className="rounded-3xl bg-brand px-5 py-5 text-brand-ink">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-ink/70">Clinica dental</p>
        <h1 className="mt-3 text-3xl">Registros</h1>
        <p className="mt-2 text-sm text-brand-ink/80">Control de tratamientos y citas en un solo flujo.</p>
      </Link>

      <nav className="mt-6 grid gap-2">
        <NavLink href="/dashboard" label="Dashboard" />
        <NavLink href="/patients" label="Pacientes" />
        <NavLink href="/appointments" label="Citas" />
        {user.canManageUsers ? <NavLink href="/users" label="Usuarios" /> : null}
      </nav>

      <div className="mt-auto rounded-3xl border border-line bg-white/60 p-4">
        <p className="text-sm font-semibold text-foreground">{user.name}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="brand">{user.roleLabel}</Badge>
          <Badge tone={user.environmentLabel === "Demo" ? "warning" : "neutral"}>
            {user.environmentLabel}
          </Badge>
        </div>
        <form action={logoutAction} className="mt-4">
          <Button type="submit" variant="secondary" className="w-full">
            Cerrar sesion
          </Button>
        </form>
      </div>
    </aside>
  );
}
