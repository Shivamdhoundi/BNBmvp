"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { OrganizationContext } from "@/server/auth/context";

export function DashboardShell({ context, children }: { context: OrganizationContext; children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      {isSidebarOpen && (
        <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div id="mobile-navigation" className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,86vw)] transform bg-slate-900 shadow-2xl transition-transform duration-300 ease-out lg:w-64 lg:translate-x-0 lg:shadow-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onNavigate={() => setIsSidebarOpen(false)} onClose={() => setIsSidebarOpen(false)} />
      </div>
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <Topbar context={context} isSidebarOpen={isSidebarOpen} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-4 sm:px-8 sm:py-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
