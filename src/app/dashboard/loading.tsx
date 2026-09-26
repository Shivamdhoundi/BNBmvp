export default function DashboardLoading() {
  return (
    <div className="flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-8 max-w-7xl w-full mx-auto">
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-1/4 rounded-lg bg-slate-200"></div>
        <div className="space-y-4">
          <div className="h-64 w-full rounded-2xl bg-slate-200"></div>
          <div className="flex gap-4">
            <div className="h-32 w-1/3 rounded-xl bg-slate-200"></div>
            <div className="h-32 w-1/3 rounded-xl bg-slate-200"></div>
            <div className="h-32 w-1/3 rounded-xl bg-slate-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
