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
  Database
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/owners", label: "Owners", icon: UserCheck },
  { href: "/dashboard/guests", label: "Guests", icon: Users },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-full shrink-0 flex-col bg-slate-900 px-4 py-5 lg:fixed lg:inset-y-0 lg:w-64 z-40 text-slate-300">
      {/* Brand Header */}
      <div className="px-2 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-white font-bold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor"/>
              <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-white text-xl tracking-tight">StayPilot</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="mt-4 flex flex-col gap-1 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-rose-500" : "text-slate-500 group-hover:text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Operations Dropdown */}
        <div className="mt-2">
          <button className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-slate-500 group-hover:text-slate-400" />
              <span>Operations</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          <div className="pl-11 pr-3 flex flex-col gap-1 mt-1">
            <Link href="/dashboard/cleaning" className="block py-2 text-sm text-slate-500 hover:text-slate-300">Cleaning</Link>
            <Link href="/dashboard/maintenance" className="block py-2 text-sm text-slate-500 hover:text-slate-300">Maintenance</Link>
          </div>
        </div>

        {/* Reports & Data */}
        <div className="mt-2 flex flex-col gap-1">
          <Link
            href="/dashboard/reports"
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-slate-500 group-hover:text-slate-400" />
            <span>Reports</span>
          </Link>

          <div className="mt-1">
            <button className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-slate-500 group-hover:text-slate-400" />
                <span>My Data</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="pl-11 pr-3 flex flex-col gap-1 mt-1">
              <Link href="/dashboard/data" className="block py-2 text-sm text-slate-500 hover:text-slate-300">Excel / Export</Link>
              <Link href="/dashboard/import" className="block py-2 text-sm text-slate-500 hover:text-slate-300">Import Data</Link>
            </div>
          </div>
        </div>

      </nav>

      <div className="mt-auto pt-4">
        <Link
          href="/dashboard/settings"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
        >
          <Settings className="h-5 w-5 text-slate-500 group-hover:text-slate-400" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}

