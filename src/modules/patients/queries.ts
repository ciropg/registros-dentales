import { prisma } from "@/lib/prisma";
import { calculateTreatmentMetrics } from "@/modules/treatments/calculators";

const PATIENTS_PAGE_SIZE = 8;

export async function listPatients(isDemo: boolean, search?: string, page = 1) {
  const query = search?.trim();
  const where = {
    isDemo,
    ...(query
      ? {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { documentNumber: { contains: query } },
          ],
        }
      : {}),
  };
  const totalCount = await prisma.patient.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PATIENTS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const patients = await prisma.patient.findMany({
    where,
    skip: (currentPage - 1) * PATIENTS_PAGE_SIZE,
    take: PATIENTS_PAGE_SIZE,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      treatments: {
        where: {
          isDemo,
        },
        include: {
          phases: true,
        },
      },
      _count: {
        select: {
          appointments: {
            where: {
              isDemo,
            },
          },
          photos: {
            where: {
              isDemo,
            },
          },
        },
      },
    },
  });

  const items = patients.map((patient) => {
    const activeTreatment = patient.treatments.find((treatment) => treatment.status !== "COMPLETED");

    return {
      ...patient,
      activeTreatment: activeTreatment
        ? {
            id: activeTreatment.id,
            title: activeTreatment.title,
            status: activeTreatment.status,
            ...calculateTreatmentMetrics(activeTreatment),
          }
        : null,
    };
  });

  return {
    items,
    page: currentPage,
    pageSize: PATIENTS_PAGE_SIZE,
    totalCount,
    totalPages,
  };
}

export async function getPatientDetail(patientId: string, isDemo: boolean) {
  const [patient, photoUsageCount] = await Promise.all([
    prisma.patient.findFirst({
      where: {
        id: patientId,
        isDemo,
      },
      include: {
        treatments: {
          where: {
            isDemo,
          },
          include: {
            dentist: {
              select: {
                id: true,
                name: true,
              },
            },
            phases: {
              orderBy: {
                phaseOrder: "asc",
              },
            },
            appointments: {
              where: {
                isDemo,
              },
              orderBy: {
                scheduledAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        appointments: {
          where: {
            isDemo,
          },
          orderBy: {
            scheduledAt: "desc",
          },
        },
        photos: {
          where: {
            isDemo,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),
    prisma.patientPhoto.count({
      where: {
        isDemo,
      },
    }),
  ]);

  if (!patient) {
    return null;
  }

  return {
    ...patient,
    photoUsageCount,
    treatments: patient.treatments.map((treatment) => ({
      ...treatment,
      metrics: calculateTreatmentMetrics(treatment),
    })),
  };
}

export async function getPatientFormDetail(patientId: string, isDemo: boolean) {
  return prisma.patient.findFirst({
    where: {
      id: patientId,
      isDemo,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      documentNumber: true,
      phone: true,
      email: true,
      birthDate: true,
      notes: true,
    },
  });
}

export async function getPatientOptions(isDemo: boolean) {
  return prisma.patient.findMany({
    where: {
      isDemo,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
}
