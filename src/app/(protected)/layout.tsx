import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";
import { canManageUsers, getEnvironmentLabel, getRoleLabel } from "@/lib/roles";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppShell
      user={{
        name: user.name,
        roleLabel: getRoleLabel(user.role),
        environmentLabel: getEnvironmentLabel(user.isDemo),
        canManageUsers: canManageUsers(user.role),
      }}
    >
      {children}
    </AppShell>
  );
}
