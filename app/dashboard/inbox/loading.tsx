export default function InboxLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-24 bg-white/5 rounded-lg" />
        <div className="h-4 w-56 bg-white/5 rounded" />
      </div>

      {/* Main content */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        <div className="flex h-full">
          {/* Conversations list */}
          <div className="w-full md:w-96 border-r border-white/10">
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="h-10 bg-white/5 rounded-xl mb-3" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-7 w-20 bg-white/5 rounded-lg" />
                ))}
              </div>
            </div>
            {/* Conversation items */}
            <div className="p-2 space-y-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                      <div className="h-3 w-32 bg-white/5 rounded mb-1" />
                      <div className="h-3 w-full bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message area */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-white/10 rounded-full mx-auto" />
              <div className="h-4 w-40 bg-white/10 rounded mx-auto" />
              <div className="h-3 w-56 bg-white/5 rounded mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
