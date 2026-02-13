"use client"

import { useState, useEffect, useRef } from "react"

interface LazyVideoProps {
  src: string
  className?: string
  poster?: string
}

export default function LazyVideo({ src, className = "", poster }: LazyVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" } // Start loading 200px before entering viewport
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Placeholder - shows until video loads */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-[#375DEE] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Only render iframe when in view */}
      {isInView && (
        <iframe
          src={src}
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  )
}
