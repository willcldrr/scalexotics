export default function ServicesLoading() {
  return (
    <div className="min-h-screen bg-black animate-pulse">
      {/* Header skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="h-7 w-32 bg-white/5 rounded" />
          <div className="flex gap-4">
            <div className="h-10 w-20 bg-white/5 rounded-full" />
            <div className="h-10 w-24 bg-white/5 rounded-full" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="h-4 w-28 bg-[#375DEE]/20 rounded mx-auto" />
          <div className="h-12 w-80 max-w-full bg-white/10 rounded mx-auto" />
          <div className="h-6 w-[500px] max-w-full bg-white/5 rounded mx-auto" />
        </div>
      </div>

      {/* Services grid skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
              <div className="w-12 h-12 bg-[#375DEE]/10 rounded-xl" />
              <div className="h-6 w-32 bg-white/10 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-5/6 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
