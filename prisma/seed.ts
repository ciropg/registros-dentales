import { AppointmentStatus, PhaseStatus, TreatmentStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.treatmentPhase.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const dentistPassword = await bcrypt.hash("Dentista123!", 10);
  const assistantPassword = await bcrypt.hash("Asistente123!", 10);

  const [admin, dentist, assistant] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Administrador",
        email: "admin@clinic.local",
        passwordHash: adminPassword,
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Dra. Camila Torres",
        email: "dentista@clinic.local",
        passwordHash: dentistPassword,
        role: UserRole.DENTIST,
      },
    }),
    prisma.user.create({
      data: {
        name: "Lucia Ramos",
        email: "asistente@clinic.local",
        passwordHash: assistantPassword,
        role: UserRole.ASSISTANT,
      },
    }),
  ]);

  const patientOne = await prisma.patient.create({
    data: {
      firstName: "Mario",
      lastName: "Quispe",
      documentNumber: "70214488",
      phone: "999111222",
      email: "mario.quispe@email.local",
      birthDate: new Date("1990-03-14"),
      notes: "Paciente con seguimiento ortodontico quincenal.",
    },
  });

  const patientTwo = await prisma.patient.create({
    data: {
      firstName: "Valeria",
      lastName: "Sanchez",
      documentNumber: "48871210",
      phone: "988777666",
      email: "valeria.sanchez@email.local",
      birthDate: new Date("1988-08-29"),
      notes: "Paciente en rehabilitacion y control periodontal.",
    },
  });

  const orthodontic = await prisma.treatment.create({
    data: {
      patientId: patientOne.id,
      dentistId: dentist.id,
      title: "Ortodoncia integral",
      diagnosis: "Maloclusion clase II y apinamiento moderado.",
      startDate: subDays(new Date(), 42),
      estimatedEndDate: addDays(new Date(), 120),
      status: TreatmentStatus.IN_PROGRESS,
      notes: "Se esperan controles cada 15 dias.",
      phases: {
        create: [
          {
            name: "Diagnostico y radiografias",
            phaseOrder: 1,
            weight: 2,
            status: PhaseStatus.COMPLETED,
            plannedDate: subDays(new Date(), 50),
            completedDate: subDays(new Date(), 46),
          },
          {
            name: "Instalacion de brackets",
            phaseOrder: 2,
            weight: 3,
            status: PhaseStatus.COMPLETED,
            plannedDate: subDays(new Date(), 40),
            completedDate: subDays(new Date(), 37),
          },
          {
            name: "Controles y ajuste",
            phaseOrder: 3,
            weight: 4,
            status: PhaseStatus.IN_PROGRESS,
            plannedDate: subDays(new Date(), 20),
          },
          {
            name: "Retencion final",
            phaseOrder: 4,
            weight: 1,
            status: PhaseStatus.PENDING,
            plannedDate: addDays(new Date(), 110),
          },
        ],
      },
    },
  });

  const rehabilitation = await prisma.treatment.create({
    data: {
      patientId: patientTwo.id,
      dentistId: dentist.id,
      title: "Rehabilitacion oral",
      diagnosis: "Desgaste oclusal y necesidad de coronas unitarias.",
      startDate: subDays(new Date(), 18),
      estimatedEndDate: addDays(new Date(), 45),
      status: TreatmentStatus.IN_PROGRESS,
      notes: "Priorizar citas de prueba y control oclusal.",
      phases: {
        create: [
          {
            name: "Preparacion de piezas",
            phaseOrder: 1,
            weight: 3,
            status: PhaseStatus.COMPLETED,
            plannedDate: subDays(new Date(), 17),
            completedDate: subDays(new Date(), 16),
          },
          {
            name: "Impresiones",
            phaseOrder: 2,
            weight: 2,
            status: PhaseStatus.COMPLETED,
            plannedDate: subDays(new Date(), 13),
            completedDate: subDays(new Date(), 12),
          },
          {
            name: "Prueba clinica",
            phaseOrder: 3,
            weight: 2,
            status: PhaseStatus.PENDING,
            plannedDate: addDays(new Date(), 3),
          },
          {
            name: "Cementacion",
            phaseOrder: 4,
            weight: 3,
            status: PhaseStatus.PENDING,
            plannedDate: addDays(new Date(), 18),
          },
        ],
      },
    },
  });

  await prisma.appointment.createMany({
    data: [
      {
        patientId: patientOne.id,
        treatmentId: orthodontic.id,
        scheduledAt: subDays(new Date(), 30),
        status: AppointmentStatus.ATTENDED,
        reason: "Control y ajuste",
        notes: "Sin incidencias.",
      },
      {
        patientId: patientOne.id,
        treatmentId: orthodontic.id,
        scheduledAt: subDays(new Date(), 15),
        status: AppointmentStatus.NO_SHOW,
        reason: "Control mensual",
      },
      {
        patientId: patientOne.id,
        treatmentId: orthodontic.id,
        scheduledAt: addDays(new Date(), 2),
        status: AppointmentStatus.SCHEDULED,
        reason: "Control y ajuste",
      },
      {
        patientId: patientTwo.id,
        treatmentId: rehabilitation.id,
        scheduledAt: subDays(new Date(), 7),
        status: AppointmentStatus.ATTENDED,
        reason: "Control de impresiones",
      },
      {
        patientId: patientTwo.id,
        treatmentId: rehabilitation.id,
        scheduledAt: addDays(new Date(), 4),
        status: AppointmentStatus.RESCHEDULED,
        reason: "Prueba clinica",
        notes: "Paciente solicito cambio por viaje.",
      },
      {
        patientId: patientTwo.id,
        treatmentId: rehabilitation.id,
        scheduledAt: addDays(new Date(), 6),
        status: AppointmentStatus.SCHEDULED,
        reason: "Prueba clinica reprogramada",
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      entityType: "seed",
      entityId: "initial-load",
      action: "SEED_EXECUTED",
      description: "Carga inicial de datos de ejemplo.",
    },
  });

  console.log("Seed completa.");
  console.log("Admin: admin@clinic.local / Admin123!");
  console.log("Dentista: dentista@clinic.local / Dentista123!");
  console.log("Asistente: asistente@clinic.local / Asistente123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
