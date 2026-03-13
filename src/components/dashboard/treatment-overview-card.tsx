import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { daysLabel } from "@/lib/date";
import type { Locale } from "@/lib/i18n/config";

export function TreatmentOverviewCard({
  treatment,
  locale = "es",
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
  locale?: Locale;
}) {
  const copy = locale === "en"
    ? {
        progress: "Progress",
        elapsedTime: "Elapsed time",
        remainingTime: "Remaining time",
        viewDetails: "View details",
        days: "days",
      }
    : {
        progress: "Avance",
        elapsedTime: "Tiempo transcurrido",
        remainingTime: "Tiempo restante",
        viewDetails: "Ver detalle",
        days: "dias",
      };

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
          <span>{copy.progress}</span>
          <span>{treatment.progressPercent}%</span>
        </div>
        <ProgressBar value={treatment.progressPercent} />
      </div>

      <div className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-2">
        <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
          <p className="font-semibold text-foreground">{treatment.daysElapsed} {copy.days}</p>
          <p>{copy.elapsedTime}</p>
        </div>
        <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
          <p className="font-semibold text-foreground">{daysLabel(treatment.daysRemaining, locale)}</p>
          <p>{copy.remainingTime}</p>
        </div>
      </div>

      <Link
        href={`/treatments/${treatment.id}`}
        className="mt-5 inline-flex text-sm font-semibold text-brand transition hover:text-brand-strong"
      >
        {copy.viewDetails}
      </Link>
    </Card>
  );
}
