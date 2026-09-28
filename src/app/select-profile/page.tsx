import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { getSignedInUser } from "@/server/auth/context";
import { ProfileCard } from "./profile-card";

export default async function SelectProfilePage() {
  const user = await getSignedInUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, organizations (id, name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const profiles = (memberships ?? []).flatMap((membership) => {
    const organization = Array.isArray(membership.organizations)
      ? membership.organizations[0]
      : membership.organizations;
    return organization
      ? [{ id: organization.id, name: organization.name, role: membership.role }]
      : [];
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-[480px] rounded-[2rem] border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark />
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900">Select your workspace</h1>
          <p className="mt-2 text-sm text-slate-500">Choose an approved workspace to continue.</p>
        </div>

        {profiles.length > 0 ? (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} id={profile.id} name={profile.name} role={profile.role} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <ShieldAlert className="mx-auto h-6 w-6 text-amber-700" />
            <p className="mt-3 text-sm font-semibold text-amber-950">No workspace access</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">Ask an administrator to invite this email address.</p>
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
