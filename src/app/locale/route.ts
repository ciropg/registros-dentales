import { NextResponse } from "next/server";
import { localeCookieName, normalizeLocale } from "@/lib/i18n/config";

function normalizeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = normalizeLocale(url.searchParams.get("lang"));
  const redirectTo = normalizeRedirectPath(url.searchParams.get("redirectTo"));
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  response.cookies.set(localeCookieName, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
