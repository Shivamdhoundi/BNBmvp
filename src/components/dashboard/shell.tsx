"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { OrganizationContext } from "@/server/auth/context";

export function DashboardShell({ context, canManageTeam = false, children }: {
  context: OrganizationContext;
  canManageTeam?: boolean;
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const panel = mobileNavigationRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
        event.preventDefault();
        items[0].focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#main-content" className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:not-sr-only focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg">
        Skip to main content
      </a>

      {isSidebarOpen && (
        <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div
        id="mobile-navigation"
        ref={mobileNavigationRef}
        role="dialog"
        aria-label="Mobile navigation"
        aria-modal={isSidebarOpen ? true : undefined}
        inert={!isSidebarOpen}
        className={`fixed inset-y-0 left-0 z-50 w-[min(19rem,86vw)] transform shadow-2xl transition-transform duration-200 ease-out lg:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar canManageTeam={canManageTeam} onNavigate={() => setIsSidebarOpen(false)} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar canManageTeam={canManageTeam} />
      </div>

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <Topbar context={context} isSidebarOpen={isSidebarOpen} onMenuClick={() => setIsSidebarOpen(true)} />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-5 focus:outline-none sm:px-8 sm:py-7 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
