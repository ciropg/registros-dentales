import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";
import { getCurrentLocale } from "@/lib/i18n/server";
import { toSearchParam } from "@/lib/utils";
import { loginAction } from "@/modules/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getCurrentLocale();
  const params = await searchParams;
  const error = toSearchParam(params.error);
  const copy = locale === "en"
    ? {
        eyebrow: "Dental clinic",
        title: "Monitor treatments, timelines, and appointments without losing traceability.",
        description:
          "This MVP centralizes patients, active treatments, progress percentage, and appointment statuses in a single operational interface.",
        treatmentTime: "Treatment timeline",
        treatmentTimeDescription: "Elapsed and remaining days for each case.",
        progress: "Real progress",
        progressDescription: "Progress is calculated from completed phases.",
        appointments: "Auditable appointments",
        appointmentsDescription: "Attended, missed, rescheduled, and canceled.",
        accessEyebrow: "Internal access",
        heading: "Sign in",
        accessDescription: "Use the demo credentials to enter the panel and review the full flow.",
        demoCredentials: "Demo credentials",
        email: "Email",
        password: "Password",
        submit: "Enter system",
      }
    : {
        eyebrow: "Clinica dental",
        title: "Supervisa tratamientos, tiempos y citas sin perder trazabilidad.",
        description:
          "Este MVP centraliza pacientes, tratamientos activos, porcentaje de avance y estados de citas en una sola interfaz operativa.",
        treatmentTime: "Tiempo de tratamiento",
        treatmentTimeDescription: "Dias transcurridos y dias restantes en cada caso.",
        progress: "Avance real",
        progressDescription: "El progreso se calcula sobre las fases completadas.",
        appointments: "Citas auditables",
        appointmentsDescription: "Asistidas, no asistidas, reprogramadas y canceladas.",
        accessEyebrow: "Acceso interno",
        heading: "Iniciar sesion",
        accessDescription: "Usa las credenciales demo para entrar al panel y revisar el flujo completo.",
        demoCredentials: "Credenciales demo",
        email: "Email",
        password: "Contrasena",
        submit: "Entrar al sistema",
      };

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="shell-panel grid-bg rounded-[2rem] border border-line p-8 lg:p-12">
        <p className="text-xs uppercase tracking-[0.35em] text-muted">{copy.eyebrow}</p>
        <h1 className="mt-4 text-5xl text-foreground">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted">
          {copy.description}
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">{copy.treatmentTime}</p>
            <p className="mt-2 text-sm text-muted">{copy.treatmentTimeDescription}</p>
          </div>
          <div className="rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">{copy.progress}</p>
            <p className="mt-2 text-sm text-muted">{copy.progressDescription}</p>
          </div>
          <div className="rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">{copy.appointments}</p>
            <p className="mt-2 text-sm text-muted">{copy.appointmentsDescription}</p>
          </div>
        </div>
      </section>

      <section className="shell-panel rounded-[2rem] border border-line p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-muted">{copy.accessEyebrow}</p>
        <h2 className="mt-3 text-4xl text-foreground">{copy.heading}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          {copy.accessDescription}
        </p>

        <div className="mt-6 rounded-3xl border border-brand/15 bg-brand/5 p-4 text-sm text-foreground">
          <p className="font-semibold">{copy.demoCredentials}</p>
          <p className="mt-2">demo.admin@clinic.local / DemoAdmin123!</p>
          <p className="mt-1">demo.dentista@clinic.local / DemoDentista123!</p>
          <p className="mt-1">demo.asistente@clinic.local / DemoAsistente123!</p>
          <p className="mt-1">demo.recepcion@clinic.local / DemoRecepcion123!</p>
        </div>

        <form action={loginAction} className="mt-8 space-y-5">
          {error ? <Alert message={error} tone="danger" /> : null}

          <Field label={copy.email}>
            <input
              className={inputClassName}
              type="email"
              name="email"
              defaultValue="demo.admin@clinic.local"
              placeholder="demo.admin@clinic.local"
              required
            />
          </Field>

          <Field label={copy.password}>
            <input
              className={inputClassName}
              type="password"
              name="password"
              defaultValue="DemoAdmin123!"
              required
            />
          </Field>

          <button type="submit" className={buttonStyles({ className: "w-full", size: "md" })}>
            {copy.submit}
          </button>
        </form>
      </section>
    </main>
  );
}
