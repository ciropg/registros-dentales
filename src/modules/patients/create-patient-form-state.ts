export const patientCreateFields = [
  "firstName",
  "lastName",
  "documentNumber",
  "phone",
  "email",
  "birthDate",
  "notes",
] as const;

export type PatientCreateField = (typeof patientCreateFields)[number];

export type PatientCreateActionState = {
  message: string | null;
  fieldErrors: Partial<Record<PatientCreateField, string>>;
};

export const initialPatientCreateActionState: PatientCreateActionState = {
  message: null,
  fieldErrors: {},
};
