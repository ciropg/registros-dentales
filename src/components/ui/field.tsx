import { cn } from "@/lib/utils";

export const inputClassName = cn(
  "w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition",
  "placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20",
);

export const textareaClassName = cn(
  inputClassName,
  "min-h-28 resize-y",
);

export const selectClassName = cn(inputClassName, "appearance-none");

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
