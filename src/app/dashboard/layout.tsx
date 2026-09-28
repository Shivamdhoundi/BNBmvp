import { redirect } from "next/navigation";

import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { getMfaGate } from "@/server/auth/mfa";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const context = await requireOrganizationContext();

  // Enforce MFA for privileged roles: verify if a factor exists, otherwise
  // enroll when mandatory. Non-privileged roles are unaffected.
  const gate = await getMfaGate(context);
  if (gate.kind === "verify") redirect("/mfa/verify");
  if (gate.kind === "enroll") redirect("/mfa/enroll");

  return (
    <DashboardShell context={context} canManageTeam={can(context.role, "team:read")}>
      {children}
    </DashboardShell>
  );
}

