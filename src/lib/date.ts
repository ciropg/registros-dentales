import { differenceInCalendarDays, format } from "date-fns";
import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";

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

export function daysLabel(days: number, locale: Locale = "es") {
  const copy = getMessages(locale).date;

  if (days === 0) {
    return copy.today;
  }

  const abs = Math.abs(days);
  const suffix = abs === 1 ? copy.day : copy.days;
  return days > 0 ? copy.dueIn(abs, suffix) : copy.overdueBy(abs, suffix);
}
