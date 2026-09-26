import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { requireOrganizationContext } from "@/server/auth/context";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const context = await requireOrganizationContext();
  return (
    <div className="min-h-screen bg-slate-50 lg:pl-64">
      <Sidebar context={context} />
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

