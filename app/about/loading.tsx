export default function AboutLoading() {
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
          <div className="h-4 w-24 bg-[#375DEE]/20 rounded mx-auto" />
          <div className="h-12 w-96 max-w-full bg-white/10 rounded mx-auto" />
          <div className="h-6 w-[600px] max-w-full bg-white/5 rounded mx-auto" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-[4/3] bg-white/5 rounded-2xl" />
          <div className="space-y-6">
            <div className="h-8 w-48 bg-white/10 rounded" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-white/5 rounded" />
              <div className="h-4 w-5/6 bg-white/5 rounded" />
              <div className="h-4 w-4/5 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
