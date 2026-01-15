export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header with time range */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-white/5 rounded-lg" />
          <div className="h-4 w-56 bg-white/5 rounded" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-16 bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
            <div className="h-3 w-20 bg-white/10 rounded mb-3" />
            <div className="h-7 w-24 bg-white/10 rounded mb-2" />
            <div className="h-3 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="h-5 w-32 bg-white/10 rounded mb-4" />
          <div className="h-64 sm:h-80 bg-white/5 rounded-lg" />
        </div>
        {/* Leads chart */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="h-5 w-28 bg-white/10 rounded mb-4" />
          <div className="h-64 sm:h-80 bg-white/5 rounded-lg" />
        </div>
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie charts */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="h-5 w-36 bg-white/10 rounded mb-4" />
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-48 flex-1 bg-white/5 rounded-lg" />
            <div className="h-48 flex-1 bg-white/5 rounded-lg" />
          </div>
        </div>
        {/* Recent activity */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="h-5 w-32 bg-white/10 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-white/10 rounded mb-1" />
                  <div className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
