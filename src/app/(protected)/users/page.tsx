import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { requireBaseRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import { getCurrentLocale } from "@/lib/i18n/server";
import { toSearchParam } from "@/lib/utils";
import { toggleUserActiveAction } from "@/modules/users/actions";
import { listManagedUsers } from "@/modules/users/queries";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [actor, locale] = await Promise.all([requireBaseRole(["ADMIN"]), getCurrentLocale()]);
  const [params, data] = await Promise.all([searchParams, listManagedUsers(actor.isDemo, locale)]);
  const success = toSearchParam(params.success);
  const error = toSearchParam(params.error);
  const copy = locale === "en"
    ? {
        demoTitle: "Demo users",
        title: "Users",
        demoDescription: "Manage demo-only accounts and avoid mixing them with live users.",
        description: "As a live administrator you can manage live and demo accounts from one place.",
        newUser: "New user",
        total: "Total",
        totalHelperDemo: "Visible users inside the demo environment.",
        totalHelper: "Visible users inside your administrative scope.",
        active: "Active",
        activeHelper: "Accounts enabled to access the system.",
        inactive: "Inactive",
        inactiveHelper: "Accounts disabled from accessing the system.",
        management: "Management",
        listTitle: "User list",
        listDescriptionDemo: "Only demo users are shown.",
        listDescription: "Live and demo users are shown for centralized management.",
        activeBadge: "Active",
        inactiveBadge: "Inactive",
        createdAt: "Created on",
        viewDetails: "View details",
        edit: "Edit",
        deactivate: "Deactivate",
        reactivate: "Reactivate",
        emptyTitle: "No users registered",
        emptyDescriptionDemo: "Create the first account available for the demo environment.",
        emptyDescription: "Create the first live or demo account available in the system.",
        createUser: "Create user",
      }
    : {
        demoTitle: "Usuarios demo",
        title: "Usuarios",
        demoDescription: "Gestiona exclusivamente cuentas demo y evita el cruce con usuarios reales.",
        description: "Como administrador real puedes gestionar cuentas reales y demo desde un solo lugar.",
        newUser: "Nuevo usuario",
        total: "Total",
        totalHelperDemo: "Usuarios visibles dentro del entorno demo.",
        totalHelper: "Usuarios visibles dentro de tu alcance administrativo.",
        active: "Activos",
        activeHelper: "Cuentas habilitadas para ingresar al sistema.",
        inactive: "Inactivos",
        inactiveHelper: "Cuentas desactivadas sin acceso al sistema.",
        management: "Gestion",
        listTitle: "Listado de usuarios",
        listDescriptionDemo: "Solo se muestran usuarios demo.",
        listDescription: "Se muestran usuarios reales y demo para gestion centralizada.",
        activeBadge: "Activo",
        inactiveBadge: "Inactivo",
        createdAt: "Creado el",
        viewDetails: "Ver detalle",
        edit: "Editar",
        deactivate: "Desactivar",
        reactivate: "Reactivar",
        emptyTitle: "Sin usuarios registrados",
        emptyDescriptionDemo: "Crea la primera cuenta disponible para el entorno demo.",
        emptyDescription: "Crea la primera cuenta real o demo disponible para el sistema.",
        createUser: "Crear usuario",
      };
  const title = actor.isDemo ? copy.demoTitle : copy.title;
  const description = actor.isDemo ? copy.demoDescription : copy.description;

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={title}
        description={description}
        locale={locale}
        action={
          <Link href="/users/new" className={buttonStyles({})}>
            {copy.newUser}
          </Link>
        }
      />

      {success ? <Alert message={success} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label={copy.total}
          value={data.stats.totalCount}
          helper={actor.isDemo ? copy.totalHelperDemo : copy.totalHelper}
        />
        <MetricCard
          label={copy.active}
          value={data.stats.activeCount}
          helper={copy.activeHelper}
        />
        <MetricCard
          label={copy.inactive}
          value={data.stats.inactiveCount}
          helper={copy.inactiveHelper}
        />
      </section>

      <Card>
        <CardHeader
          eyebrow={copy.management}
          title={copy.listTitle}
          description={
            actor.isDemo
              ? copy.listDescriptionDemo
              : copy.listDescription
          }
        />

        <div className="mt-6 space-y-4">
          {data.users.length ? (
            data.users.map((user) => (
              <div key={user.id} className="rounded-3xl border border-line bg-white/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="brand">{user.roleLabel}</Badge>
                      <Badge tone={user.active ? "success" : "neutral"}>
                        {user.active ? copy.activeBadge : copy.inactiveBadge}
                      </Badge>
                      <Badge tone={user.isDemo ? "warning" : "neutral"}>
                        {user.environmentLabel}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-lg text-foreground">{user.name}</p>
                      <p className="mt-1 text-sm text-muted">{user.email}</p>
                      <p className="mt-1 text-sm text-muted">
                        {copy.createdAt} {formatDateTime(user.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/users/${user.id}`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        {copy.viewDetails}
                      </Link>
                      <Link
                        href={`/users/${user.id}/edit`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        {copy.edit}
                      </Link>
                    </div>
                  </div>

                  <form action={toggleUserActiveAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="redirectPath" value="/users" />
                    <button
                      type="submit"
                      className={buttonStyles({
                        variant: user.active ? "danger" : "secondary",
                        size: "sm",
                      })}
                    >
                      {user.active ? copy.deactivate : copy.reactivate}
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title={copy.emptyTitle}
              description={
                actor.isDemo
                  ? copy.emptyDescriptionDemo
                  : copy.emptyDescription
              }
              action={
                <Link href="/users/new" className={buttonStyles({})}>
                  {copy.createUser}
                </Link>
              }
            />
          )}
        </div>
      </Card>
    </main>
  );
}
