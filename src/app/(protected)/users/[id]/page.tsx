import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { requireBaseRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import { toSearchParam } from "@/lib/utils";
import { toggleUserActiveAction } from "@/modules/users/actions";
import { getManagedUserDetail } from "@/modules/users/queries";

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireBaseRole(["ADMIN"]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await getManagedUserDetail(id, actor.isDemo);

  if (!user) {
    notFound();
  }

  const success = toSearchParam(query.success);
  const error = toSearchParam(query.error);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={user.name}
        description={
          actor.isDemo
            ? "Detalle del usuario dentro del entorno demo."
            : "Detalle del usuario dentro de tu alcance administrativo."
        }
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/users" className={buttonStyles({ variant: "secondary" })}>
              Volver al listado
            </Link>
            <Link href={`/users/${user.id}/edit`} className={buttonStyles({})}>
              Editar usuario
            </Link>
          </div>
        }
      />

      {success ? <Alert message={success} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader eyebrow="Perfil" title="Datos de acceso" />

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="brand">{user.roleLabel}</Badge>
            <Badge tone={user.active ? "success" : "neutral"}>
              {user.active ? "Activo" : "Inactivo"}
            </Badge>
            <Badge tone={user.environmentLabel === "Demo" ? "warning" : "neutral"}>
              {user.environmentLabel}
            </Badge>
          </div>

          <dl className="mt-6 grid gap-4 text-sm">
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Email</dt>
              <dd className="mt-1 font-semibold text-foreground">{user.email}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Creado</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDateTime(user.createdAt)}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Actualizado</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDateTime(user.updatedAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Actividad"
            title="Indicadores del usuario"
            description="Resumen rapido de participacion y estado operativo."
          />

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">Tratamientos asignados</p>
              <p className="mt-2 text-3xl text-foreground">{user._count.treatments}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">Eventos de auditoria</p>
              <p className="mt-2 text-3xl text-foreground">{user._count.auditLogs}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">Estado de la cuenta</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {user.active
                ? "La cuenta puede iniciar sesion y operar dentro de su entorno."
                : "La cuenta esta desactivada y no puede iniciar sesion."}
            </p>

            <form action={toggleUserActiveAction} className="mt-5">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="redirectPath" value={`/users/${user.id}`} />
              <button
                type="submit"
                className={buttonStyles({
                  variant: user.active ? "danger" : "secondary",
                })}
              >
                {user.active ? "Desactivar usuario" : "Reactivar usuario"}
              </button>
            </form>
          </div>
        </Card>
      </section>
    </main>
  );
}
