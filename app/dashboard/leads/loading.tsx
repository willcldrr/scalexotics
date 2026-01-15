export default function LeadsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-white/5 rounded-lg" />
          <div className="h-4 w-48 bg-white/5 rounded" />
        </div>
        <div className="h-10 w-28 bg-white/5 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="h-3 w-16 bg-white/10 rounded mb-2" />
            <div className="h-6 w-12 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="flex-1 h-10 bg-white/5 rounded-xl" />
        <div className="h-10 w-32 bg-white/5 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-white/10 rounded" />
            ))}
          </div>
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-4 border-b border-white/5">
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 bg-white/5 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
