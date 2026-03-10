"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import { patientCreateSchema } from "@/modules/patients/schemas";

export async function createPatientAction(formData: FormData) {
  const user = await requireRole([UserRole.ADMIN, UserRole.ASSISTANT, UserRole.RECEPTIONIST]);

  const parsed = patientCreateSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    documentNumber: formData.get("documentNumber"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    birthDate: formData.get("birthDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(`/patients/new${buildErrorSearch(parsed.error.issues[0]?.message ?? "No se pudo crear el paciente.")}`);
  }

  try {
    const patient = await prisma.patient.create({
      data: {
        ...parsed.data,
        birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : undefined,
      },
    });

    await recordAudit({
      actorId: user.id,
      entityType: "patient",
      entityId: patient.id,
      action: "PATIENT_CREATED",
      description: `Se creo el paciente ${patient.firstName} ${patient.lastName}.`,
    });

    revalidatePath("/patients");
    revalidatePath("/dashboard");
    redirect(`/patients/${patient.id}${buildSuccessSearch("Paciente creado correctamente.")}`);
  } catch {
    redirect(`/patients/new${buildErrorSearch("No se pudo guardar el paciente. Verifica que el documento o email no esten duplicados.")}`);
  }
}
