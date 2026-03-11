-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "treatmentId" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "rescheduledFromId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("createdAt", "id", "notes", "patientId", "reason", "rescheduledFromId", "scheduledAt", "status", "treatmentId", "updatedAt") SELECT "createdAt", "id", "notes", "patientId", "reason", "rescheduledFromId", "scheduledAt", "status", "treatmentId", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");
CREATE INDEX "Appointment_treatmentId_idx" ON "Appointment"("treatmentId");
CREATE INDEX "Appointment_scheduledAt_idx" ON "Appointment"("scheduledAt");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");
CREATE INDEX "Appointment_isDemo_idx" ON "Appointment"("isDemo");
CREATE TABLE "new_Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "birthDate" DATETIME,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Patient" ("birthDate", "createdAt", "documentNumber", "email", "firstName", "id", "lastName", "notes", "phone", "updatedAt") SELECT "birthDate", "createdAt", "documentNumber", "email", "firstName", "id", "lastName", "notes", "phone", "updatedAt" FROM "Patient";
DROP TABLE "Patient";
ALTER TABLE "new_Patient" RENAME TO "Patient";
CREATE INDEX "Patient_isDemo_idx" ON "Patient"("isDemo");
CREATE UNIQUE INDEX "Patient_documentNumber_isDemo_key" ON "Patient"("documentNumber", "isDemo");
CREATE TABLE "new_Treatment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "dentistId" TEXT,
    "title" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "estimatedEndDate" DATETIME NOT NULL,
    "actualEndDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Treatment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Treatment_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Treatment" ("actualEndDate", "createdAt", "dentistId", "diagnosis", "estimatedEndDate", "id", "notes", "patientId", "startDate", "status", "title", "updatedAt") SELECT "actualEndDate", "createdAt", "dentistId", "diagnosis", "estimatedEndDate", "id", "notes", "patientId", "startDate", "status", "title", "updatedAt" FROM "Treatment";
DROP TABLE "Treatment";
ALTER TABLE "new_Treatment" RENAME TO "Treatment";
CREATE INDEX "Treatment_patientId_idx" ON "Treatment"("patientId");
CREATE INDEX "Treatment_dentistId_idx" ON "Treatment"("dentistId");
CREATE INDEX "Treatment_status_idx" ON "Treatment"("status");
CREATE INDEX "Treatment_isDemo_idx" ON "Treatment"("isDemo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
