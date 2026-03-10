"use server";

import { PhaseStatus, TreatmentStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import {
  treatmentCreateSchema,
  treatmentPhaseUpdateSchema,
} from "@/modules/treatments/schemas";

export async function createTreatmentAction(formData: FormData) {
  const user = await requireRole([UserRole.ADMIN, UserRole.DENTIST, UserRole.ASSISTANT]);

  let parsedPhases: unknown[] = [];

  try {
    parsedPhases = JSON.parse(String(formData.get("phases") ?? "[]"));
  } catch {
    redirect(`/treatments/new${buildErrorSearch("No se pudieron leer las fases del tratamiento.")}`);
  }

  const parsed = treatmentCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    dentistId: formData.get("dentistId"),
    title: formData.get("title"),
    diagnosis: formData.get("diagnosis"),
    startDate: formData.get("startDate"),
    estimatedEndDate: formData.get("estimatedEndDate"),
    notes: formData.get("notes"),
    phases: parsedPhases,
  });

  if (!parsed.success) {
    redirect(`/treatments/new${buildErrorSearch(parsed.error.issues[0]?.message ?? "No se pudo crear el tratamiento.")}`);
  }

  const status =
    new Date(parsed.data.startDate) > new Date()
      ? TreatmentStatus.PLANNED
      : TreatmentStatus.IN_PROGRESS;

  const treatment = await prisma.treatment.create({
    data: {
      patientId: parsed.data.patientId,
      dentistId: parsed.data.dentistId,
      title: parsed.data.title,
      diagnosis: parsed.data.diagnosis,
      startDate: new Date(parsed.data.startDate),
      estimatedEndDate: new Date(parsed.data.estimatedEndDate),
      notes: parsed.data.notes,
      status,
      phases: {
        create: parsed.data.phases.map((phase, index) => ({
          name: phase.name,
          weight: phase.weight,
          phaseOrder: index + 1,
          plannedDate: phase.plannedDate ? new Date(phase.plannedDate) : undefined,
        })),
      },
    },
  });

  await recordAudit({
    actorId: user.id,
    entityType: "treatment",
    entityId: treatment.id,
    action: "TREATMENT_CREATED",
    description: `Se creo el tratamiento ${treatment.title}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/patients");
  revalidatePath(`/patients/${parsed.data.patientId}`);
  redirect(`/treatments/${treatment.id}${buildSuccessSearch("Tratamiento creado correctamente.")}`);
}

export async function updatePhaseStatusAction(formData: FormData) {
  const user = await requireRole([UserRole.ADMIN, UserRole.DENTIST, UserRole.ASSISTANT]);

  const parsed = treatmentPhaseUpdateSchema.safeParse({
    treatmentId: formData.get("treatmentId"),
    phaseId: formData.get("phaseId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(`/dashboard${buildErrorSearch("No se pudo actualizar la fase.")}`);
  }

  await prisma.treatmentPhase.update({
    where: { id: parsed.data.phaseId },
    data: {
      status: parsed.data.status,
      completedDate: parsed.data.status === PhaseStatus.COMPLETED ? new Date() : null,
    },
  });

  const phases = await prisma.treatmentPhase.findMany({
    where: { treatmentId: parsed.data.treatmentId },
    select: { status: true },
  });

  const allClosed = phases.every(
    (phase) => phase.status === PhaseStatus.COMPLETED || phase.status === PhaseStatus.SKIPPED,
  );

  await prisma.treatment.update({
    where: { id: parsed.data.treatmentId },
    data: allClosed
      ? {
          status: TreatmentStatus.COMPLETED,
          actualEndDate: new Date(),
        }
      : {
          status: TreatmentStatus.IN_PROGRESS,
          actualEndDate: null,
        },
  });

  await recordAudit({
    actorId: user.id,
    entityType: "phase",
    entityId: parsed.data.phaseId,
    action: "PHASE_STATUS_UPDATED",
    description: `Fase actualizada a ${parsed.data.status}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/treatments/${parsed.data.treatmentId}`);
  redirect(`/treatments/${parsed.data.treatmentId}${buildSuccessSearch("Fase actualizada.")}`);
}
