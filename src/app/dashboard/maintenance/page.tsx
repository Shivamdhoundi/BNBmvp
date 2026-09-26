export const metadata = {
  title: "Maintenance Operations | StayPilot",
};

export default function MaintenancePage() {
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-64px)]">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Operations</h1>
          <p className="text-sm text-slate-500">Manage maintenance requests and tasks</p>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Coming Soon</h2>
          <p className="mt-1 text-sm text-slate-500">The maintenance operations module is in development.</p>
        </div>
      </main>
    </div>
  );
}
