import { NewPatientForm } from "@/components/patients/new-patient-form";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/server";

export default async function NewPatientPage() {
  const locale = await getCurrentLocale();
  const copy = locale === "en"
    ? {
        title: "New patient",
        description: "Register the basic patient record. Only first and last names are required.",
      }
    : {
        title: "Nuevo paciente",
        description: "Registra la ficha basica del paciente. Solo nombres y apellidos son obligatorios.",
      };

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar title={copy.title} description={copy.description} locale={locale} />

      <Card>
        <NewPatientForm />
      </Card>
    </main>
  );
}
