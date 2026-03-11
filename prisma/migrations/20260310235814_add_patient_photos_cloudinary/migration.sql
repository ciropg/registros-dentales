-- CreateTable
CREATE TABLE "PatientPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "originalFilename" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "format" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientPhoto_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientPhoto_publicId_key" ON "PatientPhoto"("publicId");

-- CreateIndex
CREATE INDEX "PatientPhoto_patientId_isDemo_createdAt_idx" ON "PatientPhoto"("patientId", "isDemo", "createdAt");

-- CreateIndex
CREATE INDEX "PatientPhoto_isDemo_createdAt_idx" ON "PatientPhoto"("isDemo", "createdAt");
