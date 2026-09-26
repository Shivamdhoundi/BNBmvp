import Link from "next/link";
import { LayoutDashboard, Building2, Calendar, Sparkles, TrendingUp, Settings } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import type { OrganizationContext } from "@/server/auth/context";

const navigation = [
  { href: "/dashboard", label: "Overview Hub", icon: LayoutDashboard, badge: "Live" },
  { href: "/dashboard/properties", label: "Properties", icon: Building2, count: "14" },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar, badge: "98% Occ" },
  { href: "/dashboard/guests", label: "Guests", icon: Sparkles },
  { href: "/dashboard/owners", label: "Owners", icon: TrendingUp },
];

export function Sidebar({ context }: { context: OrganizationContext }) {
  return (
    <aside className="flex min-h-screen w-full shrink-0 flex-col border-b border-slate-200/80 bg-white/90 backdrop-blur-lg px-4 py-5 lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:border-b-0 shadow-sm z-40">
      {/* Brand Header */}
      <div className="px-2 pb-6 border-b border-slate-100">
        <BrandMark href="/dashboard" />
        {/* Workspace Selector Pill */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/80 p-2.5 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-6 w-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              {context.organization.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="font-semibold text-slate-800 truncate">{context.organization.name}</span>
          </div>
          <span className="rounded bg-rose-100/80 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 uppercase">
            {context.role}
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="mt-6 flex flex-col gap-1.5 flex-1">
        <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Management
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-rose-50/80 hover:text-rose-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 group-hover:bg-rose-100 group-hover:text-rose-800">
                  {item.badge}
                </span>
              )}
              {item.count && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 group-hover:bg-rose-100 group-hover:text-rose-800">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}

        <div className="mt-6 px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Organization
        </div>
        <Link
          href="#settings"
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-slate-200">
            <Settings className="h-4 w-4" />
          </div>
          <span>Workspace Settings</span>
        </Link>
      </nav>

      {/* Footer User Card */}
      <div className="mt-auto border-t border-slate-100 pt-4 px-2">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 font-bold text-white text-xs shadow-sm">
            {(context.user.fullName ?? context.user.email ?? "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-semibold text-slate-900">
              {context.user.fullName ?? context.user.email ?? "Workspace Member"}
            </p>
            <p className="truncate text-[10px] text-slate-500">
              {context.user.email}
            </p>
          </div>
        </div>
        <div className="mt-2.5">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}

