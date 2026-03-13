"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";

type PhaseDraft = {
  name: string;
  weight: number;
  plannedDate: string;
};

export function PhasePlanner() {
  const locale = useLocale();
  const copy = locale === "en"
    ? {
        phaseLabel: (index: number) => `Phase ${index}`,
        phaseDescription: "Define name, weight, and tentative milestone.",
        remove: "Remove",
        name: "Phase name",
        namePlaceholder: "Example: Alignment",
        weight: "Weight",
        plannedDate: "Planned date",
        optional: "Optional.",
        addPhase: "Add phase",
        initialPhases: [
          { name: "Diagnosis", weight: 2, plannedDate: "" },
          { name: "Execution", weight: 4, plannedDate: "" },
          { name: "Final check", weight: 2, plannedDate: "" },
        ] satisfies PhaseDraft[],
      }
    : {
        phaseLabel: (index: number) => `Fase ${index}`,
        phaseDescription: "Define nombre, peso e hito tentativo.",
        remove: "Quitar",
        name: "Nombre de fase",
        namePlaceholder: "Ejemplo: Alineacion",
        weight: "Peso",
        plannedDate: "Fecha planificada",
        optional: "Opcional.",
        addPhase: "Agregar fase",
        initialPhases: [
          { name: "Diagnostico", weight: 2, plannedDate: "" },
          { name: "Ejecucion", weight: 4, plannedDate: "" },
          { name: "Control final", weight: 2, plannedDate: "" },
        ] satisfies PhaseDraft[],
      };
  const [phases, setPhases] = useState<PhaseDraft[]>(copy.initialPhases);

  const serialized = useMemo(() => JSON.stringify(phases.filter((phase) => phase.name.trim())), [phases]);

  function updatePhase(index: number, field: keyof PhaseDraft, value: string) {
    setPhases((current) =>
      current.map((phase, phaseIndex) =>
        phaseIndex === index
          ? {
              ...phase,
              [field]: field === "weight" ? Number(value || "1") : value,
            }
          : phase,
      ),
    );
  }

  function addPhase() {
    setPhases((current) => [...current, { name: "", weight: 1, plannedDate: "" }]);
  }

  function removePhase(index: number) {
    setPhases((current) => current.filter((_, phaseIndex) => phaseIndex !== index));
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="phases" value={serialized} />

      {phases.map((phase, index) => (
        <div key={`${phase.name}-${index}`} className="rounded-3xl border border-line bg-white/70 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{copy.phaseLabel(index + 1)}</p>
              <p className="text-xs text-muted">{copy.phaseDescription}</p>
            </div>
            {phases.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removePhase(index)}>
                {copy.remove}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-[1.7fr_0.7fr_1fr]">
            <Field label={copy.name}>
              <input
                className={inputClassName}
                value={phase.name}
                onChange={(event) => updatePhase(index, "name", event.target.value)}
                placeholder={copy.namePlaceholder}
              />
            </Field>
            <Field label={copy.weight}>
              <input
                className={inputClassName}
                type="number"
                min={1}
                value={phase.weight}
                onChange={(event) => updatePhase(index, "weight", event.target.value)}
              />
            </Field>
            <Field label={copy.plannedDate} hint={copy.optional}>
              <input
                className={inputClassName}
                type="date"
                value={phase.plannedDate}
                onChange={(event) => updatePhase(index, "plannedDate", event.target.value)}
              />
            </Field>
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={addPhase}>
        {copy.addPhase}
      </Button>
    </div>
  );
}
