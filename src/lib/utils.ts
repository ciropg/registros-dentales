import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function toSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function buildErrorSearch(message: string) {
  return `?error=${encodeURIComponent(message)}`;
}

export function buildSuccessSearch(message: string) {
  return `?success=${encodeURIComponent(message)}`;
}
