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
import { toSearchParam } from "@/lib/utils";
import { toggleUserActiveAction } from "@/modules/users/actions";
import { listManagedUsers } from "@/modules/users/queries";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireBaseRole(["ADMIN"]);
  const [params, data] = await Promise.all([searchParams, listManagedUsers(actor.isDemo)]);
  const success = toSearchParam(params.success);
  const error = toSearchParam(params.error);
  const title = actor.isDemo ? "Usuarios demo" : "Usuarios";
  const description = actor.isDemo
    ? "Gestiona exclusivamente cuentas demo y evita el cruce con usuarios reales."
    : "Como administrador real puedes gestionar cuentas reales y demo desde un solo lugar.";

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={title}
        description={description}
        action={
          <Link href="/users/new" className={buttonStyles({})}>
            Nuevo usuario
          </Link>
        }
      />

      {success ? <Alert message={success} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total"
          value={data.stats.totalCount}
          helper={actor.isDemo ? "Usuarios visibles dentro del entorno demo." : "Usuarios visibles dentro de tu alcance administrativo."}
        />
        <MetricCard
          label="Activos"
          value={data.stats.activeCount}
          helper="Cuentas habilitadas para ingresar al sistema."
        />
        <MetricCard
          label="Inactivos"
          value={data.stats.inactiveCount}
          helper="Cuentas desactivadas sin acceso al sistema."
        />
      </section>

      <Card>
        <CardHeader
          eyebrow="Gestion"
          title="Listado de usuarios"
          description={
            actor.isDemo
              ? "Solo se muestran usuarios demo."
              : "Se muestran usuarios reales y demo para gestion centralizada."
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
                        {user.active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge tone={user.environmentLabel === "Demo" ? "warning" : "neutral"}>
                        {user.environmentLabel}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-lg text-foreground">{user.name}</p>
                      <p className="mt-1 text-sm text-muted">{user.email}</p>
                      <p className="mt-1 text-sm text-muted">
                        Creado el {formatDateTime(user.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/users/${user.id}`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        Ver detalle
                      </Link>
                      <Link
                        href={`/users/${user.id}/edit`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        Editar
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
                      {user.active ? "Desactivar" : "Reactivar"}
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin usuarios registrados"
              description={
                actor.isDemo
                  ? "Crea la primera cuenta disponible para el entorno demo."
                  : "Crea la primera cuenta real o demo disponible para el sistema."
              }
              action={
                <Link href="/users/new" className={buttonStyles({})}>
                  Crear usuario
                </Link>
              }
            />
          )}
        </div>
      </Card>
    </main>
  );
}
