import { cn } from "@/lib/utils";

type AlertTone = "success" | "danger";

const tones: Record<AlertTone, string> = {
  success: "border-success/20 bg-success/10 text-success",
  danger: "border-danger/20 bg-danger/10 text-danger",
};

export function Alert({
  message,
  tone,
}: {
  message: string;
  tone: AlertTone;
}) {
  return <div className={cn("rounded-2xl border px-4 py-3 text-sm", tones[tone])}>{message}</div>;
}
