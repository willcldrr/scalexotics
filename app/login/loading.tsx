export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 animate-pulse">
      <div className="w-full max-w-md space-y-8">
        {/* Logo skeleton */}
        <div className="flex justify-center">
          <div className="h-8 w-40 bg-white/5 rounded" />
        </div>

        {/* Form card skeleton */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="h-8 w-32 bg-white/10 rounded mx-auto" />
            <div className="h-4 w-48 bg-white/5 rounded mx-auto" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-12 bg-white/10 rounded" />
              <div className="h-10 bg-white/5 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-white/10 rounded" />
              <div className="h-10 bg-white/5 rounded-xl" />
            </div>
          </div>

          <div className="h-12 bg-white/10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
