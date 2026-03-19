export default function AIAssistantLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Card Skeleton */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-white/10 rounded" />
              <div className="h-4 w-56 bg-white/5 rounded" />
            </div>
          </div>
          <div className="h-10 w-28 bg-white/10 rounded-xl" />
        </div>
      </div>
      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-28 bg-white/5 rounded-xl" />
        ))}
      </div>
      {/* Content Grid Skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-5 h-72">
          <div className="h-5 w-32 bg-white/10 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-white/5 rounded-lg" />
            <div className="h-10 bg-white/5 rounded-lg" />
            <div className="h-10 bg-white/5 rounded-lg" />
          </div>
        </div>
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-5 h-72">
          <div className="h-5 w-32 bg-white/10 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-white/5 rounded-lg" />
            <div className="h-10 bg-white/5 rounded-lg" />
            <div className="h-10 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
