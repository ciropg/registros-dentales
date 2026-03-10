import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { daysLabel } from "@/lib/date";

export function TreatmentOverviewCard({
  treatment,
}: {
  treatment: {
    id: string;
    title: string;
    patientName: string;
    progressPercent: number;
    daysElapsed: number;
    daysRemaining: number;
    statusLabel: string;
    statusTone: "brand" | "success" | "warning" | "danger" | "neutral";
  };
}) {
  return (
    <Card className="bg-white/85">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{treatment.title}</p>
          <p className="mt-1 text-sm text-muted">{treatment.patientName}</p>
        </div>
        <Badge tone={treatment.statusTone}>{treatment.statusLabel}</Badge>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm text-muted">
          <span>Avance</span>
          <span>{treatment.progressPercent}%</span>
        </div>
        <ProgressBar value={treatment.progressPercent} />
      </div>

      <div className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-2">
        <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
          <p className="font-semibold text-foreground">{treatment.daysElapsed} dias</p>
          <p>Tiempo transcurrido</p>
        </div>
        <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
          <p className="font-semibold text-foreground">{daysLabel(treatment.daysRemaining)}</p>
          <p>Tiempo restante</p>
        </div>
      </div>

      <Link
        href={`/treatments/${treatment.id}`}
        className="mt-5 inline-flex text-sm font-semibold text-brand transition hover:text-brand-strong"
      >
        Ver detalle
      </Link>
    </Card>
  );
}
