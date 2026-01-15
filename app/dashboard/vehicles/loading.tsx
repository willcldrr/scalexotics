export default function VehiclesLoading() {
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

      {/* Search */}
      <div className="h-10 w-full max-w-md bg-white/5 rounded-xl" />

      {/* Vehicle cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Image placeholder */}
            <div className="aspect-video bg-white/10" />
            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-white/10 rounded" />
              <div className="h-4 w-1/2 bg-white/5 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-24 bg-white/10 rounded" />
                <div className="h-6 w-16 bg-white/5 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
