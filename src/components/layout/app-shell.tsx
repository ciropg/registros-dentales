import { Sidebar } from "@/components/layout/sidebar";
import type { Locale } from "@/lib/i18n/config";

export function AppShell({
  user,
  locale,
  children,
}: {
  user: {
    name: string;
    roleLabel: string;
    environmentLabel: string;
    isDemo: boolean;
    canManageUsers: boolean;
  };
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[280px_1fr]">
      <Sidebar user={user} locale={locale} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
