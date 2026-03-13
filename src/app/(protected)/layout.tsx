import { AppShell } from "@/components/layout/app-shell";
import { getCurrentLocale } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { canManageUsers, getEnvironmentLabel, getRoleLabel } from "@/lib/roles";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, locale] = await Promise.all([requireUser(), getCurrentLocale()]);

  return (
    <AppShell
      user={{
        name: user.name,
        roleLabel: getRoleLabel(user.role, locale),
        environmentLabel: getEnvironmentLabel(user.isDemo, locale),
        isDemo: user.isDemo,
        canManageUsers: canManageUsers(user.role),
      }}
      locale={locale}
    >
      {children}
    </AppShell>
  );
}
