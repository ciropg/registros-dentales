"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { deletePatientImage, uploadPatientImage } from "@/lib/cloudinary";
import { requireBaseRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getCurrentLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import {
  patientCreateFields,
  type PatientCreateActionState,
} from "@/modules/patients/create-patient-form-state";
import {
  createPatientCreateSchema,
  createPatientPhotoUploadSchema,
  createPatientUpdateSchema,
} from "@/modules/patients/schemas";

const DEMO_PATIENT_PHOTO_LIMIT = 5;
const MAX_PATIENT_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

function getPatientRedirectPath(patientId: string) {
  return `/patients/${patientId}`;
}

function getPatientEditRedirectPath(patientId: string) {
  return `/patients/${patientId}/edit`;
}

function revalidatePatientPaths(patientId?: string) {
  revalidatePath("/patients");
  revalidatePath("/patients/new");
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");
  revalidatePath("/dashboard");
  revalidatePath("/treatments/new");

  if (patientId) {
    revalidatePath(getPatientRedirectPath(patientId));
    revalidatePath(getPatientEditRedirectPath(patientId));
  }
}

function logPatientImageCleanupFailures(results: PromiseSettledResult<unknown>[], patientId: string) {
  const failedCount = results.filter((result) => result.status === "rejected").length;

  if (!failedCount) {
    return;
  }

  console.warn(`Patient delete cleanup failed for ${failedCount} photo(s) of patient ${patientId}.`);
}

function buildPatientCreateFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): PatientCreateActionState["fieldErrors"] {
  const nextErrors: PatientCreateActionState["fieldErrors"] = {};

  for (const field of patientCreateFields) {
    const message = fieldErrors[field]?.[0];

    if (message) {
      nextErrors[field] = message;
    }
  }

  return nextErrors;
}

function buildDuplicatePatientNameFieldErrors(): PatientCreateActionState["fieldErrors"] {
  return {
    firstName: "Ya existe un paciente con ese nombre y apellido en este entorno.",
    lastName: "Ya existe un paciente con ese nombre y apellido en este entorno.",
  };
}

function getPatientUniqueConstraintFieldErrors(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;
  const targetFields = Array.isArray(target)
    ? target.map((value) => String(value))
    : typeof target === "string"
      ? [target]
      : [];

  if (targetFields.includes("documentNumber")) {
    return {
      documentNumber: "Ya existe un paciente con ese documento en este entorno.",
    } satisfies PatientCreateActionState["fieldErrors"];
  }

  if (targetFields.includes("firstName") || targetFields.includes("lastName")) {
    return buildDuplicatePatientNameFieldErrors();
  }

  return {};
}

async function getPatientOrRedirect(patientId: string, isDemo: boolean, redirectPath: string) {
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      isDemo,
    },
    select: {
      id: true,
    },
  });

  if (!patient) {
    redirect(`${redirectPath}${buildErrorSearch("El paciente ya no existe o no pertenece a tu entorno.")}`);
  }

  return patient;
}

async function findDuplicatePatientFieldErrors(params: {
  patientId?: string;
  firstName: string;
  lastName: string;
  documentNumber?: string;
  isDemo: boolean;
}) {
  if (params.documentNumber) {
    const existingPatientWithDocument = await prisma.patient.findFirst({
      where: {
        documentNumber: params.documentNumber,
        isDemo: params.isDemo,
        ...(params.patientId
          ? {
              id: {
                not: params.patientId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingPatientWithDocument) {
      return {
        documentNumber: "Ya existe un paciente con ese documento en este entorno.",
      } satisfies PatientCreateActionState["fieldErrors"];
    }
  }

  const existingPatientWithSameName = await prisma.patient.findFirst({
    where: {
      firstName: params.firstName,
      lastName: params.lastName,
      isDemo: params.isDemo,
      ...(params.patientId
        ? {
            id: {
              not: params.patientId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  if (existingPatientWithSameName) {
    return buildDuplicatePatientNameFieldErrors();
  }

  return null;
}

function getPatientPhotoUploadErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "No se pudo subir la foto del paciente.";
  }

  if (
    error.message === "Cloudinary is not configured."
    || error.message === "Invalid Cloudinary cloud name."
  ) {
    return "La configuracion de Cloudinary es invalida. Revisa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.";
  }

  return "No se pudo subir la foto del paciente.";
}

function getPatientPhotoDeleteErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "No se pudo eliminar la foto del paciente.";
  }

  if (
    error.message === "Cloudinary is not configured."
    || error.message === "Invalid Cloudinary cloud name."
  ) {
    return "La foto se puede quitar del sistema, pero la configuracion de Cloudinary es invalida.";
  }

  return "No se pudo eliminar la foto del paciente.";
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

export async function createPatientAction(
  _previousState: PatientCreateActionState,
  formData: FormData,
): Promise<PatientCreateActionState> {
  const locale = await getCurrentLocale();
  const user = await requireBaseRole(["ADMIN", "ASSISTANT", "RECEPTIONIST"]);
  const copy = locale === "en"
    ? {
        fixFields: "Fix the highlighted fields.",
        saveFailed: "The patient could not be saved.",
        created: "Patient created successfully.",
      }
    : {
        fixFields: "Corrige los campos marcados.",
        saveFailed: "No se pudo guardar el paciente.",
        created: "Paciente creado correctamente.",
      };

  const parsed = createPatientCreateSchema(locale).safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    documentNumber: formData.get("documentNumber"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    birthDate: formData.get("birthDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      message: copy.fixFields,
      fieldErrors: buildPatientCreateFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    const duplicateFieldErrors = await findDuplicatePatientFieldErrors({
      ...parsed.data,
      isDemo: user.isDemo,
    });

    if (duplicateFieldErrors) {
      return {
        message: copy.fixFields,
        fieldErrors: duplicateFieldErrors,
      };
    }

    const patient = await prisma.patient.create({
      data: {
        ...parsed.data,
        isDemo: user.isDemo,
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

    revalidatePatientPaths(patient.id);
    redirect(`/patients/${patient.id}${buildSuccessSearch(copy.created)}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        message: copy.fixFields,
        fieldErrors: getPatientUniqueConstraintFieldErrors(error),
      };
    }

    console.error("Patient create failed", error);
    return {
      message: copy.saveFailed,
      fieldErrors: {},
    };
  }
}

export async function updatePatientAction(
  _previousState: PatientCreateActionState,
  formData: FormData,
): Promise<PatientCreateActionState> {
  const locale = await getCurrentLocale();
  const user = await requireBaseRole(["ADMIN", "ASSISTANT", "RECEPTIONIST"]);
  const copy = locale === "en"
    ? {
        fixFields: "Fix the highlighted fields.",
        updateFailed: "The patient could not be updated.",
        updated: "Patient updated successfully.",
      }
    : {
        fixFields: "Corrige los campos marcados.",
        updateFailed: "No se pudo actualizar el paciente.",
        updated: "Paciente actualizado correctamente.",
      };

  const parsed = createPatientUpdateSchema(locale).safeParse({
    patientId: formData.get("patientId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    documentNumber: formData.get("documentNumber"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    birthDate: formData.get("birthDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      message: copy.fixFields,
      fieldErrors: buildPatientCreateFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const redirectPath = getPatientEditRedirectPath(parsed.data.patientId);
  await getPatientOrRedirect(parsed.data.patientId, user.isDemo, "/patients");

  try {
    const duplicateFieldErrors = await findDuplicatePatientFieldErrors({
      patientId: parsed.data.patientId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      documentNumber: parsed.data.documentNumber,
      isDemo: user.isDemo,
    });

    if (duplicateFieldErrors) {
      return {
        message: copy.fixFields,
        fieldErrors: duplicateFieldErrors,
      };
    }

    const patient = await prisma.patient.update({
      where: {
        id: parsed.data.patientId,
      },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        documentNumber: parsed.data.documentNumber,
        phone: parsed.data.phone,
        email: parsed.data.email,
        birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
        notes: parsed.data.notes,
      },
    });

    await recordAudit({
      actorId: user.id,
      entityType: "patient",
      entityId: patient.id,
      action: "PATIENT_UPDATED",
      description: `Se actualizo el paciente ${patient.firstName} ${patient.lastName}.`,
    });

    revalidatePatientPaths(patient.id);
    redirect(`${getPatientRedirectPath(patient.id)}${buildSuccessSearch(copy.updated)}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        message: copy.fixFields,
        fieldErrors: getPatientUniqueConstraintFieldErrors(error),
      };
    }

    console.error("Patient update failed", error);

    redirect(`${redirectPath}${buildErrorSearch(copy.updateFailed)}`);
  }
}

export async function deletePatientAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "ASSISTANT", "RECEPTIONIST"]);
  const patientId = String(formData.get("patientId") ?? "");
  const redirectPath = getPatientRedirectPath(patientId);

  if (!patientId) {
    redirect(`/patients${buildErrorSearch("No se pudo identificar el paciente.")}`);
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      isDemo: user.isDemo,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photos: {
        where: {
          isDemo: user.isDemo,
        },
        select: {
          id: true,
          publicId: true,
        },
      },
      _count: {
        select: {
          appointments: {
            where: {
              isDemo: user.isDemo,
            },
          },
          treatments: {
            where: {
              isDemo: user.isDemo,
            },
          },
        },
      },
    },
  });

  if (!patient) {
    redirect(`/patients${buildErrorSearch("El paciente ya no existe o no pertenece a tu entorno.")}`);
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          entityType: "patient",
          entityId: patient.id,
          action: "PATIENT_DELETED",
          description: `Se elimino el paciente ${patient.firstName} ${patient.lastName}.`,
          metadata: JSON.stringify({
            isDemo: user.isDemo,
            treatmentCount: patient._count.treatments,
            appointmentCount: patient._count.appointments,
            photoCount: patient.photos.length,
          }),
        },
      });

      await transaction.patient.delete({
        where: {
          id: patient.id,
        },
      });
    });

    const cleanupResults = await Promise.allSettled(
      patient.photos.map((photo) => deletePatientImage(photo.publicId)),
    );

    logPatientImageCleanupFailures(cleanupResults, patient.id);

    revalidatePatientPaths();
    redirect(`/patients${buildSuccessSearch("Paciente eliminado correctamente.")}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Patient delete failed", error);
    redirect(`${redirectPath}${buildErrorSearch("No se pudo eliminar el paciente.")}`);
  }
}

export async function uploadPatientPhotoAction(formData: FormData) {
  const locale = await getCurrentLocale();
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

  const parsedMetadata = createPatientPhotoUploadSchema(locale).safeParse({
    description: formData.get("description"),
  });

  if (!parsedMetadata.success) {
    redirect(`${redirectPath}${buildErrorSearch(parsedMetadata.error.issues[0]?.message ?? "No se pudo validar la descripcion de la foto.")}`);
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      isDemo: user.isDemo,
    },
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
        description: parsedMetadata.data.description,
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
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Patient photo upload failed", error);

    if (uploadedPublicId) {
      await Promise.allSettled([deletePatientImage(uploadedPublicId)]);
    }

    redirect(`${redirectPath}${buildErrorSearch(getPatientPhotoUploadErrorMessage(error))}`);
  }
}

export async function deletePatientPhotoAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const patientId = String(formData.get("patientId") ?? "");
  const photoId = String(formData.get("photoId") ?? "");
  const redirectPath = patientId ? getPatientRedirectPath(patientId) : "/patients";

  if (!patientId || !photoId) {
    redirect(`/patients${buildErrorSearch("No se pudo identificar la foto a eliminar.")}`);
  }

  const photo = await prisma.patientPhoto.findFirst({
    where: {
      id: photoId,
      patientId,
      isDemo: user.isDemo,
    },
    select: {
      id: true,
      publicId: true,
      originalFilename: true,
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!photo) {
    redirect(`${redirectPath}${buildErrorSearch("La foto ya no existe o no pertenece a tu entorno.")}`);
  }

  try {
    await prisma.patientPhoto.delete({
      where: {
        id: photo.id,
      },
    });

    await Promise.allSettled([deletePatientImage(photo.publicId)]);

    await recordAudit({
      actorId: user.id,
      entityType: "patient-photo",
      entityId: photo.id,
      action: "PATIENT_PHOTO_DELETED",
      description: `Se elimino una foto del paciente ${photo.patient.firstName} ${photo.patient.lastName}.`,
      metadata: {
        patientId: photo.patient.id,
        isDemo: user.isDemo,
        originalFilename: photo.originalFilename,
      },
    });

    revalidatePath("/patients");
    revalidatePath(redirectPath);
    redirect(`${redirectPath}${buildSuccessSearch("Foto eliminada correctamente.")}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Patient photo delete failed", error);

    redirect(`${redirectPath}${buildErrorSearch(getPatientPhotoDeleteErrorMessage(error))}`);
  }
}
