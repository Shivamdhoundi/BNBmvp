"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, ChevronDown, CheckCircle2, User, Settings, Menu } from "lucide-react";
import type { OrganizationContext } from "@/server/auth/context";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export function Topbar({ context, onMenuClick }: { context?: OrganizationContext; onMenuClick?: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden -ml-2 p-2 text-slate-600 hover:bg-slate-100 rounded-md"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Input */}
        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search properties, bookings... (⌘K)"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-12 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-rose-500"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-900">Notifications</span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex gap-3 text-xs">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Cleaning Completed</p>
                    <p className="text-slate-500 text-[11px]">Villa Serenity turnover ready</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-lg py-1 px-2 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-left">
              <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                {context?.organization?.name?.substring(0, 2).toUpperCase() || "SP"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {context?.organization?.name || "Workspace"}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {context?.user?.fullName || context?.user?.email || "User"}
                </p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">{context?.user?.email}</p>
                <p className="text-xs text-slate-500 capitalize">{context?.role || "Member"} role</p>
              </div>
              
              <div className="py-1">
                <Link href="/select-profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                  <User className="h-4 w-4" />
                  Switch Profile
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                  <Settings className="h-4 w-4" />
                  Account Settings
                </Link>
              </div>
              
              <div className="border-t border-slate-100 py-1 px-4">
                <SignOutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
