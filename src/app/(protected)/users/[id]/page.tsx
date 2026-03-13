import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { SearchParamFeedbackModal } from "@/components/ui/search-param-feedback-modal";
import { requireBaseRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import { getCurrentLocale } from "@/lib/i18n/server";
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
  const [actor, locale] = await Promise.all([requireBaseRole(["ADMIN"]), getCurrentLocale()]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await getManagedUserDetail(id, actor.isDemo, locale);

  if (!user) {
    notFound();
  }

  const success = toSearchParam(query.success);
  const error = toSearchParam(query.error);
  const copy = locale === "en"
    ? {
        demoDescription: "User details inside the demo environment.",
        description: "User details inside your administrative scope.",
        back: "Back to list",
        edit: "Edit user",
        updatedDescription: "The user changes were saved successfully.",
        operationCompleted: "Operation completed",
        profile: "Profile",
        accessData: "Access data",
        active: "Active",
        inactive: "Inactive",
        email: "Email",
        created: "Created",
        updated: "Updated",
        activity: "Activity",
        indicators: "User indicators",
        indicatorsDescription: "Quick summary of participation and operational status.",
        assignedTreatments: "Assigned treatments",
        auditEvents: "Audit events",
        accountStatus: "Account status",
        accountStatusActive: "The account can sign in and operate inside its environment.",
        accountStatusInactive: "The account is deactivated and cannot sign in.",
        deactivate: "Deactivate user",
        reactivate: "Reactivate user",
      }
    : {
        demoDescription: "Detalle del usuario dentro del entorno demo.",
        description: "Detalle del usuario dentro de tu alcance administrativo.",
        back: "Volver al listado",
        edit: "Editar usuario",
        updatedDescription: "Los cambios del usuario ya fueron guardados correctamente.",
        operationCompleted: "Operacion completada",
        profile: "Perfil",
        accessData: "Datos de acceso",
        active: "Activo",
        inactive: "Inactivo",
        email: "Email",
        created: "Creado",
        updated: "Actualizado",
        activity: "Actividad",
        indicators: "Indicadores del usuario",
        indicatorsDescription: "Resumen rapido de participacion y estado operativo.",
        assignedTreatments: "Tratamientos asignados",
        auditEvents: "Eventos de auditoria",
        accountStatus: "Estado de la cuenta",
        accountStatusActive: "La cuenta puede iniciar sesion y operar dentro de su entorno.",
        accountStatusInactive: "La cuenta esta desactivada y no puede iniciar sesion.",
        deactivate: "Desactivar usuario",
        reactivate: "Reactivar usuario",
      };

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={user.name}
        description={
          actor.isDemo
            ? copy.demoDescription
            : copy.description
        }
        locale={locale}
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/users" className={buttonStyles({ variant: "secondary" })}>
              {copy.back}
            </Link>
            <Link href={`/users/${user.id}/edit`} className={buttonStyles({})}>
              {copy.edit}
            </Link>
          </div>
        }
      />

      <SearchParamFeedbackModal
        message={success}
        queryKey="success"
        title={success ?? copy.operationCompleted}
        description={copy.updatedDescription}
      />
      {error ? <Alert message={error} tone="danger" /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader eyebrow={copy.profile} title={copy.accessData} />

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="brand">{user.roleLabel}</Badge>
            <Badge tone={user.active ? "success" : "neutral"}>
              {user.active ? copy.active : copy.inactive}
            </Badge>
            <Badge tone={user.isDemo ? "warning" : "neutral"}>
              {user.environmentLabel}
            </Badge>
          </div>

          <dl className="mt-6 grid gap-4 text-sm">
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.email}</dt>
              <dd className="mt-1 font-semibold text-foreground">{user.email}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.created}</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDateTime(user.createdAt)}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.updated}</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDateTime(user.updatedAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader
            eyebrow={copy.activity}
            title={copy.indicators}
            description={copy.indicatorsDescription}
          />

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">{copy.assignedTreatments}</p>
              <p className="mt-2 text-3xl text-foreground">{user._count.treatments}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">{copy.auditEvents}</p>
              <p className="mt-2 text-3xl text-foreground">{user._count.auditLogs}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">{copy.accountStatus}</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {user.active
                ? copy.accountStatusActive
                : copy.accountStatusInactive}
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
                {user.active ? copy.deactivate : copy.reactivate}
              </button>
            </form>
          </div>
        </Card>
      </section>
    </main>
  );
}
