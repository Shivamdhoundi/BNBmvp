export const metadata = {
  title: "Reports | StayPilot",
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-64px)]">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Analyze your property operations and revenue</p>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Coming Soon</h2>
          <p className="mt-1 text-sm text-slate-500">Advanced reporting is currently in development.</p>
        </div>
      </main>
    </div>
  );
}
