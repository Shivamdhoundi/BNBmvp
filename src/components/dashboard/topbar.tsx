"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, User } from "lucide-react";
import type { OrganizationContext } from "@/server/auth/context";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export function Topbar({ context, isSidebarOpen = false, onMenuClick }: {
  context?: OrganizationContext;
  isSidebarOpen?: boolean;
  onMenuClick?: () => void;
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const userLabel = context?.user?.fullName || context?.user?.email || "Account";
  const initials = userLabel.substring(0, 2).toUpperCase();

  useEffect(() => {
    if (!showProfileMenu) return;
    const onOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuContainerRef.current?.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onOutsidePointer);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointer);
      document.removeEventListener("keydown", onEscape);
    };
  }, [showProfileMenu]);

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm shadow-slate-100/40 backdrop-blur sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          aria-controls="mobile-navigation"
          aria-expanded={isSidebarOpen}
          className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:block">Current workspace</p>
          <p className="truncate text-sm font-bold text-slate-900 sm:text-base">{context?.organization?.name || "StayPilot"}</p>
        </div>
      </div>

      <div className="relative shrink-0" ref={menuContainerRef}>
        <button
          ref={menuButtonRef}
          type="button"
          aria-label={showProfileMenu ? "Close account menu" : "Open account menu"}
          aria-expanded={showProfileMenu}
          aria-controls="account-dropdown"
          onClick={() => setShowProfileMenu((open) => !open)}
          className="flex min-h-11 items-center gap-2 rounded-xl px-1.5 transition hover:bg-slate-100 sm:px-2"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-100 text-xs font-bold text-rose-800" aria-hidden="true">{initials}</span>
          <span className="hidden max-w-40 text-left sm:block">
            <span className="block truncate text-sm font-semibold leading-tight text-slate-900">{userLabel}</span>
            <span className="block truncate text-xs capitalize text-slate-500">{context?.role?.replaceAll("_", " ") || "Member"}</span>
          </span>
          <ChevronDown aria-hidden="true" className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${showProfileMenu ? "rotate-180" : ""}`} />
        </button>
        {showProfileMenu && (
          <div id="account-dropdown" className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">{context?.user?.email || "Signed in"}</p>
              <p className="mt-1 text-xs capitalize text-slate-500">{context?.role?.replaceAll("_", " ") || "Member"} role</p>
            </div>
            <div className="py-1">
              <Link href="/select-profile" onClick={() => setShowProfileMenu(false)} className="flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <User aria-hidden="true" className="h-4 w-4" /> Switch workspace
              </Link>
            </div>
            <div className="border-t border-slate-100 px-4 py-1"><SignOutButton /></div>
          </div>
        )}
      </div>
    </header>
  );
}
