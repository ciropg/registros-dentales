import { AppointmentStatus, PhaseStatus, TreatmentStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";
import {
  getAllUserRoles,
  getRoleDescription,
  getRoleLabel,
  isDemoRole,
} from "../src/lib/roles";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.treatmentPhase.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  await prisma.role.createMany({
    data: getAllUserRoles().map((role) => ({
      code: role,
      name: getRoleLabel(role),
      description: getRoleDescription(role),
      isDemo: isDemoRole(role),
    })),
  });

  const userSeeds = [
    {
      name: "Administrador",
      email: "admin@clinic.local",
      password: "Admin123!",
      role: UserRole.ADMIN,
      isDemo: false,
    },
    {
      name: "Dra. Camila Torres",
      email: "dentista@clinic.local",
      password: "Dentista123!",
      role: UserRole.DENTIST,
      isDemo: false,
    },
    {
      name: "Lucia Ramos",
      email: "asistente@clinic.local",
      password: "Asistente123!",
      role: UserRole.ASSISTANT,
      isDemo: false,
    },
    {
      name: "Mariela Soto",
      email: "recepcion@clinic.local",
      password: "Recepcion123!",
      role: UserRole.RECEPTIONIST,
      isDemo: false,
    },
    {
      name: "Demo Administrador",
      email: "demo.admin@clinic.local",
      password: "DemoAdmin123!",
      role: UserRole.DEMO_ADMIN,
      isDemo: true,
    },
    {
      name: "Demo Dra. Carla Vega",
      email: "demo.dentista@clinic.local",
      password: "DemoDentista123!",
      role: UserRole.DEMO_DENTIST,
      isDemo: true,
    },
    {
      name: "Demo Paula Rios",
      email: "demo.asistente@clinic.local",
      password: "DemoAsistente123!",
      role: UserRole.DEMO_ASSISTANT,
      isDemo: true,
    },
    {
      name: "Demo Ana Perez",
      email: "demo.recepcion@clinic.local",
      password: "DemoRecepcion123!",
      role: UserRole.DEMO_RECEPTIONIST,
      isDemo: true,
    },
  ];

  const createdUsers = await Promise.all(
    userSeeds.map(async (user) =>
      prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash: await bcrypt.hash(user.password, 10),
          role: user.role,
          isDemo: user.isDemo,
        },
      }),
    ),
  );

  const admin = createdUsers.find((user) => user.role === UserRole.ADMIN);
  const dentist = createdUsers.find((user) => user.role === UserRole.DENTIST);

  if (!admin || !dentist) {
    throw new Error("No se pudieron crear los usuarios base para el seed.");
  }

  const patientOne = await prisma.patient.create({
    data: {
      firstName: "Mario",
      lastName: "Quispe",
      documentNumber: "70214488",
      phone: "999111222",
      email: "mario.quispe@email.local",
      birthDate: new Date("1990-03-14"),
      notes: "Paciente con seguimiento ortodontico quincenal.",
      isDemo: false,
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
      isDemo: false,
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
      isDemo: false,
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
      isDemo: false,
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
        isDemo: false,
      },
      {
        patientId: patientOne.id,
        treatmentId: orthodontic.id,
        scheduledAt: subDays(new Date(), 15),
        status: AppointmentStatus.NO_SHOW,
        reason: "Control mensual",
        isDemo: false,
      },
      {
        patientId: patientOne.id,
        treatmentId: orthodontic.id,
        scheduledAt: addDays(new Date(), 2),
        status: AppointmentStatus.SCHEDULED,
        reason: "Control y ajuste",
        isDemo: false,
      },
      {
        patientId: patientTwo.id,
        treatmentId: rehabilitation.id,
        scheduledAt: subDays(new Date(), 7),
        status: AppointmentStatus.ATTENDED,
        reason: "Control de impresiones",
        isDemo: false,
      },
      {
        patientId: patientTwo.id,
        treatmentId: rehabilitation.id,
        scheduledAt: addDays(new Date(), 4),
        status: AppointmentStatus.RESCHEDULED,
        reason: "Prueba clinica",
        notes: "Paciente solicito cambio por viaje.",
        isDemo: false,
      },
      {
        patientId: patientTwo.id,
        treatmentId: rehabilitation.id,
        scheduledAt: addDays(new Date(), 6),
        status: AppointmentStatus.SCHEDULED,
        reason: "Prueba clinica reprogramada",
        isDemo: false,
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
  console.log("Recepcionista: recepcion@clinic.local / Recepcion123!");
  console.log("Demo admin: demo.admin@clinic.local / DemoAdmin123!");
  console.log("Demo dentista: demo.dentista@clinic.local / DemoDentista123!");
  console.log("Demo asistente: demo.asistente@clinic.local / DemoAsistente123!");
  console.log("Demo recepcionista: demo.recepcion@clinic.local / DemoRecepcion123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
