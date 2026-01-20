export default function ReactivationLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg" />
          <div className="h-9 w-48 bg-white/10 rounded-lg" />
        </div>
        <div className="h-5 w-96 bg-white/5 rounded-lg" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-10 w-28 bg-white/10 rounded-lg animate-pulse"
          />
        ))}
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-white/5 rounded-xl border border-white/10 animate-pulse"
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
        <div className="h-80 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
