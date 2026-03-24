"use client"

export default function MatrixRainLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="flex h-[60px] items-end gap-1"
        role="status"
        aria-label="Loading"
      >
        <div className="w-1.5 matrix-h-1 rounded-sm bg-gradient-to-b from-transparent via-white to-transparent animate-matrix-rain-drop matrix-drop-1" />
        <div className="w-1.5 matrix-h-2 rounded-sm bg-gradient-to-b from-transparent via-white to-transparent animate-matrix-rain-drop matrix-drop-2" />
        <div className="w-1.5 matrix-h-3 rounded-sm bg-gradient-to-b from-transparent via-white to-transparent animate-matrix-rain-drop matrix-drop-3" />
        <div className="w-1.5 matrix-h-4 rounded-sm bg-gradient-to-b from-transparent via-white to-transparent animate-matrix-rain-drop matrix-drop-4" />
        <div className="w-1.5 matrix-h-5 rounded-sm bg-gradient-to-b from-transparent via-white to-transparent animate-matrix-rain-drop matrix-drop-5" />
        <div className="w-1.5 matrix-h-6 rounded-sm bg-gradient-to-b from-transparent via-white to-transparent animate-matrix-rain-drop matrix-drop-6" />
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
}
