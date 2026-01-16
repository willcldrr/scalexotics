export default function ConnectionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-9 w-48 bg-white/5 rounded-lg" />
        <div className="h-5 w-80 bg-white/5 rounded mt-2" />
      </div>

      {/* Search */}
      <div className="h-12 w-full max-w-md bg-white/5 rounded-xl" />

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 w-28 bg-white/5 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Stats */}
      <div className="h-5 w-48 bg-white/5 rounded" />

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/5" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-white/10 rounded mb-2" />
                <div className="h-3 w-20 bg-white/5 rounded" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 mb-4">
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-4/5 bg-white/5 rounded" />
            </div>

            {/* Button */}
            <div className="h-10 w-full bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
