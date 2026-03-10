import { differenceInCalendarDays, format } from "date-fns";

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "--";
  }

  return format(new Date(value), "dd/MM/yyyy");
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "--";
  }

  return format(new Date(value), "dd/MM/yyyy HH:mm");
}

export function dayDistance(from: Date, to: Date) {
  return differenceInCalendarDays(to, from);
}

export function daysLabel(days: number) {
  if (days === 0) {
    return "Hoy";
  }

  const abs = Math.abs(days);
  const suffix = abs === 1 ? "dia" : "dias";
  return days > 0 ? `Faltan ${abs} ${suffix}` : `Vencido por ${abs} ${suffix}`;
}
