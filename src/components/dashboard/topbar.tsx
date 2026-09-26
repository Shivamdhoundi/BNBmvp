"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, Plus, MapPin, Sparkles, CheckCircle2 } from "lucide-react";

export function Topbar() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md">
      {/* Search Input & Command Trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search properties, bookings, tasks... (⌘K)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-12 py-2 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Action Icons & Badges */}
      <div className="flex items-center gap-3">
        {/* Location & Live Ops Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/60 px-3 py-1 text-xs font-medium text-teal-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <MapPin className="h-3.5 w-3.5 text-teal-600" />
          <span>Gurugram Hub • Live</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-semibold text-xs text-slate-900 uppercase tracking-wider">Live Updates</span>
                <span className="text-[11px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">3 New</span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex gap-3 text-xs">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Cleaning Completed</p>
                    <p className="text-slate-500 text-[11px]">Villa Serenity turnover ready for 2 PM check-in</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">5 mins ago</span>
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">New Instant Booking</p>
                    <p className="text-slate-500 text-[11px]">Penthouse 4B booked for 4 nights (₹48,000)</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">22 mins ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <Link
          href="/dashboard/properties/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-teal-600/20 transition hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Property</span>
        </Link>
      </div>
    </header>
  );
}
