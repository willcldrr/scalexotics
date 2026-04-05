"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to server-side observability; avoid surfacing details in the UI.
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-white/60">
        An unexpected error occurred. Our team has been notified. You can try again or return home.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-white/30">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
