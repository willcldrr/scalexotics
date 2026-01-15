export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-4 w-64 bg-white/5 rounded" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="h-4 w-20 bg-white/10 rounded mb-3" />
            <div className="h-8 w-24 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 h-80">
          <div className="h-4 w-32 bg-white/10 rounded mb-4" />
          <div className="h-full w-full bg-white/5 rounded-lg" />
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 h-80">
          <div className="h-4 w-32 bg-white/10 rounded mb-4" />
          <div className="h-full w-full bg-white/5 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
