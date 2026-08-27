import { requireUser } from "@/lib/require";
import { getAlerts } from "@/lib/alerts";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const alerts = await getAlerts();
  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 lg:block">
        <Sidebar role={user.role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} alerts={alerts} />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
