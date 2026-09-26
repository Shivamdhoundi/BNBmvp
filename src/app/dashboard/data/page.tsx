export const metadata = {
  title: "Export Data | StayPilot",
};

export default function ExportDataPage() {
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-64px)]">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Export Data</h1>
          <p className="text-sm text-slate-500">Export your data to Excel or CSV</p>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Coming Soon</h2>
          <p className="mt-1 text-sm text-slate-500">Data export functionality is in development.</p>
        </div>
      </main>
    </div>
  );
}
