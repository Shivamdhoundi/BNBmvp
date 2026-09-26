"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setActiveProfile(organizationId: string) {
  const cookieStore = await cookies();
  cookieStore.set("staypilot_active_org_id", organizationId, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  redirect("/dashboard");
}
