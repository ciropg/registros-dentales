import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/date";

export function AppointmentList({
  title,
  description,
  appointments,
}: {
  title: string;
  description: string;
  appointments: Array<{
    id: string;
    patientName: string;
    reason: string;
    statusLabel: string;
    statusTone: "brand" | "success" | "warning" | "danger" | "neutral";
    scheduledAt: Date;
  }>;
}) {
  return (
    <Card>
      <h2 className="text-2xl text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>

      <div className="mt-6 space-y-4">
        {appointments.length ? (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="rounded-2xl border border-line bg-white/70 px-4 py-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{appointment.patientName}</p>
                  <p className="mt-1 text-sm text-muted">{appointment.reason || "Sin motivo registrado."}</p>
                  <p className="mt-2 text-sm text-muted">{formatDateTime(appointment.scheduledAt)}</p>
                </div>
                <Badge tone={appointment.statusTone}>{appointment.statusLabel}</Badge>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-white/60 px-4 py-5 text-sm text-muted">
            No hay registros para este bloque.
          </p>
        )}
      </div>

      <Link
        href="/appointments"
        className="mt-6 inline-flex text-sm font-semibold text-brand transition hover:text-brand-strong"
      >
        Abrir agenda completa
      </Link>
    </Card>
  );
}
