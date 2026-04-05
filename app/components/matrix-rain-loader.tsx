"use client"

import { useState, useEffect } from "react"

export default function MatrixRainLoader() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade in on mount
    const timer = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div
      className={`min-h-[60vh] flex items-center justify-center transition-opacity duration-500 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <span className="text-white/40 text-sm">Loading...</span>
      </div>
    </div>
  )
}
