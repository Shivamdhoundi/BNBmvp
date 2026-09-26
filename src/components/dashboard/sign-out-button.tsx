"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <button 
      onClick={async () => { setIsSigningOut(true); await signOut(); }} 
      className="flex w-full items-center gap-2 py-2 text-sm text-rose-600 transition hover:text-rose-700 disabled:opacity-50" 
      disabled={isSigningOut}
    >
      <LogOut className="h-4 w-4" />
      {isSigningOut ? "Signing out…" : "Log out"}
    </button>
  );
}
