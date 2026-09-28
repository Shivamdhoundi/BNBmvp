"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserCheck, 
  CalendarCheck, 
  Calendar, 
  ReceiptText, 
  Settings,
  ChevronDown,
  BarChart3,
  Database,
  ShieldCheck,
  X
} from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/owners", label: "Owners", icon: UserCheck },
  { href: "/dashboard/guests", label: "Guests", icon: Users },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText, soon: true },
];

function SoonBadge() {
  return (
    <span className="ml-auto rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
      Soon
    </span>
  );
}

export function Sidebar({ onNavigate, onClose, canManageTeam = false }: { onNavigate?: () => void; onClose?: () => void; canManageTeam?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto overscroll-contain bg-slate-900 px-4 py-5 text-slate-300 [padding-bottom:max(1.25rem,env(safe-area-inset-bottom))]">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2 pb-4">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-white font-bold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor"/>
              <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-white text-xl tracking-tight">StayPilot</span>
        </Link>
        <button type="button" onClick={onClose} aria-label="Close navigation" className="grid h-11 w-11 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="mt-2 flex min-h-max flex-1 flex-col gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-rose-500" : "text-slate-500 group-hover:text-slate-400"}`} />
              <span>{item.label}</span>
              {item.soon ? <SoonBadge /> : null}
            </Link>
          );
        })}

        {/* Operations Dropdown */}
        <div className="mt-2">
          <div className="flex w-full items-center justify-between px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              <span>Operations</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
          <div className="pl-11 pr-3 flex flex-col gap-1 mt-1">
            <Link href="/dashboard/cleaning" onClick={onNavigate} className="flex items-center py-2 text-sm text-slate-500 hover:text-slate-300">Cleaning<SoonBadge /></Link>
            <Link href="/dashboard/maintenance" onClick={onNavigate} className="flex items-center py-2 text-sm text-slate-500 hover:text-slate-300">Maintenance<SoonBadge /></Link>
          </div>
        </div>

        {/* Reports & Data */}
        <div className="mt-2 flex flex-col gap-1">
          <Link
            href="/dashboard/reports"
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-slate-500 group-hover:text-slate-400" />
            <span>Reports</span>
            <SoonBadge />
          </Link>

          <div className="mt-1">
            <div className="flex w-full items-center justify-between px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4" />
                <span>My Data</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            <div className="pl-11 pr-3 flex flex-col gap-1 mt-1">
              <Link href="/dashboard/data" onClick={onNavigate} className="flex items-center py-2 text-sm text-slate-500 hover:text-slate-300">Excel / Export<SoonBadge /></Link>
              <Link href="/dashboard/import" onClick={onNavigate} className="flex items-center py-2 text-sm text-slate-500 hover:text-slate-300">Import Data<SoonBadge /></Link>
            </div>
          </div>
        </div>

      </nav>

      <div className="mt-auto space-y-1 pt-4">
        {canManageTeam && (
          <Link
            href="/dashboard/team"
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
              pathname === "/dashboard/team" || pathname.startsWith("/dashboard/team/")
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className={`h-5 w-5 ${pathname.startsWith("/dashboard/team") ? "text-rose-500" : "text-slate-500 group-hover:text-slate-400"}`} />
            <span>Team &amp; Security</span>
          </Link>
        )}
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
        >
          <Settings className="h-5 w-5 text-slate-500 group-hover:text-slate-400" />
          <span>Settings</span>
          <SoonBadge />
        </Link>
      </div>
    </aside>
  );
}

