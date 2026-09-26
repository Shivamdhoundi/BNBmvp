"use client";

import { useState } from "react";
import { signOut } from "@/app/actions/auth";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return <button onClick={async () => { setIsSigningOut(true); await signOut(); }} className="text-sm text-[var(--muted)] transition hover:text-[#17211d]" disabled={isSigningOut}>{isSigningOut ? "Signing out…" : "Sign out"}</button>;
}
