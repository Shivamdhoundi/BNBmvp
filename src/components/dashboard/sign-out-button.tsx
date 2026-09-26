"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  return <button onClick={async () => { setIsSigningOut(true); await createClient().auth.signOut(); router.replace("/sign-in"); router.refresh(); }} className="text-sm text-[var(--muted)] transition hover:text-[#17211d]" disabled={isSigningOut}>{isSigningOut ? "Signing out…" : "Sign out"}</button>;
}
