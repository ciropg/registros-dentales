CREATE UNIQUE INDEX "Patient_firstName_lastName_isDemo_key"
ON "Patient"("firstName", "lastName", "isDemo");
