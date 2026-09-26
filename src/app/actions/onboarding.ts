"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(formData: FormData) {
  const name = String(formData.get("name"));
  const slug = String(formData.get("slug"));
  const defaultCurrency = String(formData.get("defaultCurrency"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create an organization." };
  }

  // Use the RPC function to create org and assign role transactionally
  const { error } = await supabase.rpc("create_organization_with_role", {
    input_name: name,
    input_slug: slug,
    input_default_currency: defaultCurrency,
    input_created_by: user.id,
  });

  if (error) {
    // If the RPC fails (e.g., if it's missing in MVP), fallback to single table insert
    // Note: this fallback might violate RLS if policies are strict. 
    // If RPC isn't deployed, this is a soft fallback for the MVP without custom Postgres functions.
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name,
        slug,
        default_currency: defaultCurrency,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (orgError) {
      return { error: orgError.message };
    }

    if (orgData) {
      await supabase.from("organization_members").insert({
        organization_id: orgData.id,
        user_id: user.id,
        role: "super_admin",
        status: "active",
      });
    }
  }

  redirect("/dashboard");
}
