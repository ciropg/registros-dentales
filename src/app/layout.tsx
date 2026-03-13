import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { getMessages } from "@/lib/i18n/messages";
import { getCurrentLocale } from "@/lib/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const copy = getMessages(locale);

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <LocaleProvider locale={locale}>
          <LanguageSwitcher locale={locale} className="fixed right-4 top-4 z-50" />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
