"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Building2, Calendar, CalendarCheck, FileDown, FileUp,
  LayoutDashboard, ReceiptText, Settings, ShieldCheck, Sparkles,
  UserCheck, Users, Wrench, X,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };
const mainLinks: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/owners", label: "Owners", icon: UserCheck },
  { href: "/dashboard/guests", label: "Guests", icon: Users },
];

const operationsLinks: NavItem[] = [
  { href: "/dashboard/cleaning", label: "Cleaning", icon: Sparkles },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText },
];

const insightLinks: NavItem[] = [
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/data", label: "Export data", icon: FileDown },
  { href: "/dashboard/import", label: "Import guests", icon: FileUp },
];

function NavigationLink({ item, pathname, onNavigate }: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active
        ? "border-rose-400 bg-white/10 text-white"
        : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon aria-hidden="true" className={`h-[18px] w-[18px] shrink-0 ${active ? "text-rose-300" : "text-slate-400 group-hover:text-white"}`} />
      <span>{item.label}</span>
      {active && <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-400" />}
    </Link>
  );
}

function NavSection({ title, items, pathname, onNavigate }: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      {items.map((item) => <NavigationLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />)}
    </div>
  );
}

export function Sidebar({ onNavigate, onClose, canManageTeam = false }: {
  onNavigate?: () => void;
  onClose?: () => void;
  canManageTeam?: boolean;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto overscroll-contain bg-slate-950 px-4 py-5 text-slate-200 [padding-bottom:max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 pb-5">
        <Link href="/dashboard" onClick={onNavigate} className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-lg font-black text-white shadow-lg shadow-rose-950/40" aria-hidden="true">S</span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-white">StayPilot</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Operations</span>
          </span>
        </Link>
        <button type="button" onClick={onClose} aria-label="Close navigation" className="grid h-11 w-11 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Primary navigation" className="flex min-h-max flex-1 flex-col">
        <NavSection title="Workspace" items={mainLinks} pathname={pathname} onNavigate={onNavigate} />
        <NavSection title="Operations" items={operationsLinks} pathname={pathname} onNavigate={onNavigate} />
        <NavSection title="Insights & data" items={insightLinks} pathname={pathname} onNavigate={onNavigate} />
      </nav>

      <div className="mt-6 space-y-1 border-t border-white/10 pt-3">
        {canManageTeam && <NavigationLink item={{ href: "/dashboard/team", label: "Team & security", icon: ShieldCheck }} pathname={pathname} onNavigate={onNavigate} />}
        <NavigationLink item={{ href: "/dashboard/settings", label: "Settings", icon: Settings }} pathname={pathname} onNavigate={onNavigate} />
      </div>
    </aside>
  );
}
