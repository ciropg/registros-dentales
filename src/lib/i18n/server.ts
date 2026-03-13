import { cookies } from "next/headers";
import { defaultLocale, localeCookieName, normalizeLocale, type Locale } from "@/lib/i18n/config";

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(localeCookieName)?.value ?? defaultLocale);
}
