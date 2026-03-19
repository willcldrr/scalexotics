export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Revenue Chart Skeleton */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 h-80">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-white/10 rounded-lg" />
            <div className="h-8 w-16 bg-white/10 rounded-lg" />
            <div className="h-8 w-16 bg-white/10 rounded-lg" />
          </div>
        </div>
        <div className="h-full w-full bg-white/5 rounded-lg" />
      </div>
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4">
            <div className="h-3 bg-white/10 rounded w-1/2 mb-3" />
            <div className="h-6 bg-white/10 rounded w-2/3" />
          </div>
        ))}
      </div>
      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4 h-48" />
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4 h-48" />
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-4 h-48" />
      </div>
    </div>
  )
}
