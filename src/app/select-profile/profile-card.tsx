"use client";

import { useTransition } from "react";
import { ChevronRight } from "lucide-react";
import { setActiveProfile } from "./actions";

export function ProfileCard({ id, name, role }: { id: string; name: string; role: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await setActiveProfile(id);
    });
  }

  // Generate initials for the avatar
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Basic styling for roles
  const roleDisplay = role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Operations";
  
  // Random color based on first letter for the avatar background
  const colorMap: Record<string, string> = {
    A: "bg-blue-100 text-blue-700",
    B: "bg-purple-100 text-purple-700",
    C: "bg-green-100 text-green-700",
    H: "bg-emerald-100 text-emerald-700",
    S: "bg-rose-100 text-rose-700",
  };
  const avatarColor = colorMap[initials[0]] || "bg-amber-100 text-amber-700";

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`group flex w-full items-center justify-between rounded-2xl border bg-white p-4 text-left transition ${
        isPending ? "opacity-70 cursor-wait" : "hover:border-rose-200 hover:bg-rose-50/30"
      } border-slate-200`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold ${avatarColor}`}>
          {initials}
        </div>
        <div>
          <p className="text-[15px] font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">
            {roleDisplay} • Properties
          </p>
        </div>
      </div>
      <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${isPending ? "translate-x-1" : "group-hover:translate-x-1 group-hover:text-rose-500"}`} />
    </button>
  );
}
