import { requireOrganizationContext } from "@/server/auth/context";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const context = await requireOrganizationContext();
  return (
    <DashboardShell context={context}>
      {children}
    </DashboardShell>
  );
}

