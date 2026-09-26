import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { getSignedInUser } from "@/server/auth/context";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "./profile-card";

export default async function SelectProfilePage() {
  const user = await getSignedInUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();

  // Fetch organizations where the user is a member
  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select(`
      role,
      organizations (
        id,
        name,
        slug
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    console.error("Error fetching profiles:", error);
  }

  const profiles = memberships?.map((m) => {
    const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
    return {
      id: org?.id,
      name: org?.name,
      role: m.role,
    };
  }) || [];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-[480px] rounded-[2rem] bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        
        <div className="flex flex-col items-center text-center mb-8">
          <BrandMark />
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900">Select your profile</h1>
          <p className="mt-2 text-sm text-slate-500">You have multiple profiles. Choose one to continue.</p>
        </div>

        <div className="space-y-3">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              id={profile.id!}
              name={profile.name!}
              role={profile.role}
            />
          ))}

          <Link
            href="/onboarding"
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-slate-200">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-slate-900">Create new profile</p>
                <p className="text-xs text-slate-500">Add a new organization or account</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </Link>
        </div>

      </div>
    </main>
  );
}
