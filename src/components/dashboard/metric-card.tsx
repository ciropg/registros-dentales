import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card className="bg-white/80">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">{label}</p>
      <p className="mt-4 text-4xl text-foreground">{value}</p>
      <p className="mt-3 text-sm text-muted">{helper}</p>
    </Card>
  );
}
