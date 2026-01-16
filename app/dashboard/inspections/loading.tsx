import { Loader2 } from "lucide-react"

export default function InspectionsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-56 bg-white/10 rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-72 bg-white/5 rounded-lg animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse mx-auto mb-1" />
            <div className="h-4 w-12 bg-white/5 rounded animate-pulse mx-auto" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-12 bg-white/10 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-5 w-40 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
