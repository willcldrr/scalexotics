export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-32 bg-white/5 rounded-lg" />
        <div className="h-4 w-64 bg-white/5 rounded" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.08] pb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-white/5 rounded-lg" />
        ))}
      </div>

      {/* Settings form skeleton */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-6 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-10 w-full bg-white/5 rounded-xl" />
          </div>
        ))}
        <div className="pt-4">
          <div className="h-10 w-32 bg-white/10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
