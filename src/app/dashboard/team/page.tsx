import { assignableRoles, can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listInvitations } from "@/server/invitations/service";
import { listTeamMembers } from "@/server/team/service";
import { TeamClient } from "@/components/team/team-client";

export const metadata = {
  title: "Team & Security | StayPilot",
};

export default async function TeamPage() {
  const context = await requireOrganizationContext();

  if (!can(context.role, "team:read")) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-slate-900">You don&apos;t have access to Team &amp; Security.</h1>
        <p className="mt-2 text-slate-500">Ask a workspace administrator if you need access.</p>
      </div>
    );
  }

  const [members, invitations] = await Promise.all([
    listTeamMembers(context),
    listInvitations(context.organization.id),
  ]);

  return (
    <TeamClient
      members={members}
      invitations={invitations}
      currentUserId={context.user.id}
      currentRole={context.role}
      assignableRoles={[...assignableRoles]}
    />
  );
}
