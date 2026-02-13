import { Loader2 } from "lucide-react"

export default function CRMLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-24 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-5 w-64 bg-white/5 rounded mt-2 animate-pulse" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-white/10 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    </div>
  )
}
