"use client"

import { useEffect } from "react"

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Leads page error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <pre className="text-left text-sm text-red-400 bg-white/5 p-4 rounded-xl overflow-auto max-h-60 border border-white/10">
          {error.message}
          {"\n\n"}
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
