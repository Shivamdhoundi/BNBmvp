"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bell, ChevronDown, CheckCircle2, User, Settings, Menu, X } from "lucide-react";
import type { OrganizationContext } from "@/server/auth/context";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export function Topbar({ context, isSidebarOpen = false, onMenuClick }: { context?: OrganizationContext; isSidebarOpen?: boolean; onMenuClick?: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (!showNotifications && !showProfileMenu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showNotifications, showProfileMenu]);

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <button type="button" onClick={onMenuClick} aria-label="Open navigation" aria-controls="mobile-navigation" aria-expanded={isSidebarOpen} className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative hidden w-full max-w-xs sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search properties, bookings..." className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500" />
        </div>
        <span className="truncate text-sm font-semibold text-slate-900 sm:hidden">{context?.organization?.name || "StayPilot"}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <div className="relative">
          <button type="button" onClick={() => { setShowNotifications((value) => !value); setShowProfileMenu(false); }} className="relative grid h-11 w-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Notifications" aria-expanded={showNotifications}>
            {showNotifications ? <X className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {!showNotifications && <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-rose-500" />}
          </button>
          {showNotifications && (
            <div className="fixed inset-x-3 top-[4.5rem] z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
              <div className="border-b border-slate-100 pb-3 text-sm font-semibold text-slate-900">Notifications</div>
              <div className="mt-3 flex gap-3 text-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></div>
                <div className="min-w-0"><p className="font-medium text-slate-800">Cleaning completed</p><p className="break-words text-[11px] text-slate-500">Villa Serenity turnover ready</p></div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => { setShowProfileMenu((value) => !value); setShowNotifications(false); }} className="flex h-11 items-center gap-2 rounded-xl px-1.5 transition hover:bg-slate-50 sm:px-2" aria-label="Open account menu" aria-expanded={showProfileMenu}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">{context?.organization?.name?.substring(0, 2).toUpperCase() || "SP"}</div>
            <div className="hidden text-left sm:block"><p className="max-w-36 truncate text-sm font-semibold leading-tight text-slate-900">{context?.organization?.name || "Workspace"}</p><p className="max-w-36 truncate text-[11px] leading-tight text-slate-500">{context?.user?.fullName || context?.user?.email || "User"}</p></div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          {showProfileMenu && (
            <div className="fixed inset-x-3 top-[4.5rem] z-50 rounded-2xl border border-slate-200 bg-white py-1 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-64">
              <div className="border-b border-slate-100 px-4 py-3"><p className="truncate text-sm font-medium text-slate-900">{context?.user?.email}</p><p className="text-xs capitalize text-slate-500">{context?.role || "Member"} role</p></div>
              <div className="py-1"><Link href="/select-profile" className="flex min-h-11 items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><User className="h-4 w-4" />Switch workspace</Link><Link href="/dashboard/settings" className="flex min-h-11 items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><Settings className="h-4 w-4" />Account settings</Link></div>
              <div className="border-t border-slate-100 px-4 py-1"><SignOutButton /></div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
