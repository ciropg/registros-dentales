import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function toSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function toPositiveIntSearchParam(value: string | string[] | undefined, fallback = 1) {
  const normalizedValue = toSearchParam(value);

  if (!normalizedValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export function buildErrorSearch(message: string) {
  return `?error=${encodeURIComponent(message)}`;
}

export function buildSuccessSearch(message: string) {
  return `?success=${encodeURIComponent(message)}`;
}
