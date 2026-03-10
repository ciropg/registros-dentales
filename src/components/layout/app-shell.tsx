import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({
  user,
  children,
}: {
  user: {
    name: string;
    role: string;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[280px_1fr]">
      <Sidebar user={user} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
