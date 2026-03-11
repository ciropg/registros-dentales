"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deletePatientImage, uploadPatientImage } from "@/lib/cloudinary";
import { requireBaseRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import { patientCreateSchema } from "@/modules/patients/schemas";

const DEMO_PATIENT_PHOTO_LIMIT = 5;
const MAX_PATIENT_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

function getPatientRedirectPath(patientId: string) {
  return `/patients/${patientId}`;
}

function parsePatientPhotoFile(file: FormDataEntryValue | null): { file: File } | { error: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una imagen para adjuntar." } as const;
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Solo se permiten archivos de imagen." } as const;
  }

  if (file.size > MAX_PATIENT_PHOTO_SIZE_BYTES) {
    return { error: "La imagen no puede superar 10 MB." } as const;
  }

  return { file } as const;
}

async function trimDemoPatientPhotos(excludedPhotoId: string) {
  const totalCount = await prisma.patientPhoto.count({
    where: {
      isDemo: true,
    },
  });

  const overflow = totalCount - DEMO_PATIENT_PHOTO_LIMIT;

  if (overflow <= 0) {
    return [];
  }

  const photosToDelete = await prisma.patientPhoto.findMany({
    where: {
      isDemo: true,
      NOT: {
        id: excludedPhotoId,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: overflow,
  });

  if (!photosToDelete.length) {
    return [];
  }

  await prisma.patientPhoto.deleteMany({
    where: {
      id: {
        in: photosToDelete.map((photo) => photo.id),
      },
    },
  });

  await Promise.allSettled(
    photosToDelete.map((photo) => deletePatientImage(photo.publicId)),
  );

  return photosToDelete;
}

export async function createPatientAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "ASSISTANT", "RECEPTIONIST"]);

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

export async function uploadPatientPhotoAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const patientId = String(formData.get("patientId") ?? "");
  const redirectPath = patientId ? getPatientRedirectPath(patientId) : "/patients";

  if (!patientId) {
    redirect(`/patients${buildErrorSearch("No se pudo identificar el paciente.")}`);
  }

  const parsedFile = parsePatientPhotoFile(formData.get("photo"));

  if ("error" in parsedFile) {
    redirect(`${redirectPath}${buildErrorSearch(parsedFile.error)}`);
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!patient) {
    redirect(`/patients${buildErrorSearch("El paciente ya no existe.")}`);
  }

  let uploadedPublicId: string | null = null;

  try {
    const buffer = Buffer.from(await parsedFile.file.arrayBuffer());
    const upload = await uploadPatientImage({
      buffer,
      patientId,
      isDemo: user.isDemo,
      filename: parsedFile.file.name,
    });

    uploadedPublicId = upload.public_id;

    const photo = await prisma.patientPhoto.create({
      data: {
        patientId,
        publicId: upload.public_id,
        secureUrl: upload.secure_url,
        originalFilename: parsedFile.file.name,
        width: upload.width,
        height: upload.height,
        bytes: upload.bytes,
        format: upload.format,
        isDemo: user.isDemo,
      },
    });

    const removedPhotos = user.isDemo ? await trimDemoPatientPhotos(photo.id) : [];

    await recordAudit({
      actorId: user.id,
      entityType: "patient-photo",
      entityId: photo.id,
      action: "PATIENT_PHOTO_UPLOADED",
      description: `Se adjunto una foto al paciente ${patient.firstName} ${patient.lastName}.`,
      metadata: {
        patientId: patient.id,
        isDemo: user.isDemo,
        removedPhotoIds: removedPhotos.map((removedPhoto) => removedPhoto.id),
      },
    });

    revalidatePath("/patients");
    revalidatePath(redirectPath);

    const message = removedPhotos.length
      ? "Foto adjuntada. Se elimino la foto demo mas antigua para mantener el limite compartido de 5."
      : "Foto adjuntada correctamente.";

    redirect(`${redirectPath}${buildSuccessSearch(message)}`);
  } catch {
    if (uploadedPublicId) {
      await Promise.allSettled([deletePatientImage(uploadedPublicId)]);
    }

    redirect(`${redirectPath}${buildErrorSearch("No se pudo subir la foto del paciente.")}`);
  }
}
