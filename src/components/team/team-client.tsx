"use client";

import { useActionState } from "react";
import { Plus, ShieldCheck, UserRound } from "lucide-react";

import {
  changeRoleAction,
  changeStatusAction,
  inviteMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
  type TeamActionState,
} from "@/app/dashboard/team/actions";
import type { AppRole } from "@/lib/permissions";
import type { TeamMemberDTO } from "@/server/team/service";

const initialState: TeamActionState = {};

type InvitationItem = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
};

const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 sm:text-sm";

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    suspended: "bg-rose-50 text-rose-700 border-rose-200",
    invited: "bg-amber-50 text-amber-700 border-amber-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${styles[status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {titleCase(status)}
    </span>
  );
}

export function TeamClient({
  members,
  invitations,
  currentUserId,
  currentRole,
  assignableRoles,
}: {
  members: TeamMemberDTO[];
  invitations: InvitationItem[];
  currentUserId: string;
  currentRole: AppRole;
  assignableRoles: AppRole[];
}) {
  const [inviteState, inviteAction, invitePending] = useActionState(inviteMemberAction, initialState);
  const roleOptions = currentRole === "super_admin" ? (["super_admin", ...assignableRoles] as AppRole[]) : assignableRoles;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Team &amp; Security</h1>
        <p className="mt-1 text-sm text-slate-500">Invite teammates, manage roles, and control workspace access.</p>
      </div>

      {/* Invite */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Plus className="h-4 w-4 text-rose-500" /> Invite a member
        </h2>
        <form action={inviteAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-xs font-semibold text-slate-700">
            Email
            <input name="email" type="email" required maxLength={240} className={inputClass} placeholder="teammate@example.com" />
          </label>
          <label className="block text-xs font-semibold text-slate-700 sm:w-48">
            Role
            <select name="role" defaultValue="operations" className={inputClass}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{titleCase(role)}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={invitePending}
            className="min-h-11 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
          >
            {invitePending ? "Sending…" : "Send invite"}
          </button>
        </form>
        {inviteState.error ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{inviteState.error}</p> : null}
        {inviteState.fieldErrors?.email?.[0] ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{inviteState.fieldErrors.email[0]}</p> : null}
        {inviteState.success ? <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{inviteState.success}</p> : null}
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">Pending invitations</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <ul className="divide-y divide-slate-100">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{invitation.email}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      {titleCase(invitation.role)} <StatusBadge status={invitation.status} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={resendInvitationAction}>
                      <input type="hidden" name="email" value={invitation.email} />
                      <input type="hidden" name="role" value={invitation.role} />
                      <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Resend</button>
                    </form>
                    <form action={revokeInvitationAction}>
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50">Revoke</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Members */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Members</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {members.map((member) => {
              const isSelf = member.userId === currentUserId;
              return (
                <li key={member.membershipId} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {member.fullName || member.email}{isSelf ? " (You)" : ""}
                      </p>
                      <p className="truncate text-xs text-slate-500">{member.email}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge status={member.status} />
                        {member.mfaVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <ShieldCheck className="h-3 w-3" /> MFA
                          </span>
                        ) : null}
                        {member.lastSignInAt ? (
                          <span className="text-[11px] text-slate-400">Last login {new Date(member.lastSignInAt).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Never signed in</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={changeRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={member.userId} />
                      <select name="role" defaultValue={member.role} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700">
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>{titleCase(role)}</option>
                        ))}
                      </select>
                      <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Update</button>
                    </form>
                    {!isSelf && (
                      <form action={changeStatusAction}>
                        <input type="hidden" name="userId" value={member.userId} />
                        <input type="hidden" name="status" value={member.status === "suspended" ? "active" : "suspended"} />
                        <button
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            member.status === "suspended"
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              : "border-rose-200 text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          {member.status === "suspended" ? "Restore" : "Suspend"}
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
