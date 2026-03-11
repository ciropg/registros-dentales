import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import { toSearchParam } from "@/lib/utils";
import { loginAction } from "@/modules/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = toSearchParam(params.error);

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="shell-panel grid-bg rounded-[2rem] border border-line p-8 lg:p-12">
        <p className="text-xs uppercase tracking-[0.35em] text-muted">Clinica dental</p>
        <h1 className="mt-4 text-5xl text-foreground">
          Supervisa tratamientos, tiempos y citas sin perder trazabilidad.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted">
          Este MVP centraliza pacientes, tratamientos activos, porcentaje de avance y estados de citas en una
          sola interfaz operativa.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">Tiempo de tratamiento</p>
            <p className="mt-2 text-sm text-muted">Dias transcurridos y dias restantes en cada caso.</p>
          </div>
          <div className="rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">Avance real</p>
            <p className="mt-2 text-sm text-muted">El progreso se calcula sobre las fases completadas.</p>
          </div>
          <div className="rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">Citas auditables</p>
            <p className="mt-2 text-sm text-muted">Asistidas, no asistidas, reprogramadas y canceladas.</p>
          </div>
        </div>
      </section>

      <section className="shell-panel rounded-[2rem] border border-line p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-muted">Acceso interno</p>
        <h2 className="mt-3 text-4xl text-foreground">Iniciar sesion</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Usa las credenciales sembradas para entrar al panel y revisar el flujo completo.
        </p>

        <div className="mt-6 grid gap-4 rounded-3xl border border-brand/15 bg-brand/5 p-4 text-sm text-foreground md:grid-cols-2">
          <div>
            <p className="font-semibold">Entorno real</p>
            <p className="mt-2">admin@clinic.local / Admin123!</p>
            <p className="mt-1">dentista@clinic.local / Dentista123!</p>
            <p className="mt-1">asistente@clinic.local / Asistente123!</p>
            <p className="mt-1">recepcion@clinic.local / Recepcion123!</p>
          </div>
          <div>
            <p className="font-semibold">Entorno demo</p>
            <p className="mt-2">demo.admin@clinic.local / DemoAdmin123!</p>
            <p className="mt-1">demo.dentista@clinic.local / DemoDentista123!</p>
            <p className="mt-1">demo.asistente@clinic.local / DemoAsistente123!</p>
            <p className="mt-1">demo.recepcion@clinic.local / DemoRecepcion123!</p>
          </div>
        </div>

        <form action={loginAction} className="mt-8 space-y-5">
          {error ? <Alert message={error} tone="danger" /> : null}

          <Field label="Email">
            <input
              className={inputClassName}
              type="email"
              name="email"
              defaultValue="admin@clinic.local"
              placeholder="admin@clinic.local"
              required
            />
          </Field>

          <Field label="Contrasena">
            <input
              className={inputClassName}
              type="password"
              name="password"
              defaultValue="Admin123!"
              required
            />
          </Field>

          <button type="submit" className={buttonStyles({ className: "w-full", size: "md" })}>
            Entrar al sistema
          </button>
        </form>
      </section>
    </main>
  );
}
