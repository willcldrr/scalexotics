"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    // Start fade out after a brief delay to ensure smooth transition
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 800)

    // Remove from DOM after fade animation completes
    const removeTimer = setTimeout(() => {
      setIsLoading(false)
    }, 1300)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className={`transform transition-all duration-500 ${isFading ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}>
        <Image
          src="/fulllogo.jpg"
          alt="Velocity Labs"
          width={400}
          height={400}
          className="w-48 h-48 md:w-72 md:h-72 object-contain rounded-xl"
          priority
        />
      </div>
    </div>
  )
}
