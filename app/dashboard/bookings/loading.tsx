export default function BookingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-white/5 rounded-lg" />
          <div className="h-4 w-48 bg-white/5 rounded" />
        </div>
        <div className="h-10 w-32 bg-white/5 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="h-3 w-20 bg-white/10 rounded mb-2" />
            <div className="h-6 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Calendar/Table skeleton */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-white/10 rounded" />
            <div className="h-8 w-8 bg-white/10 rounded" />
          </div>
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
