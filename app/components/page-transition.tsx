"use client"

import { useState, useEffect, useRef } from "react"
import MatrixRainLoader from "./matrix-rain-loader"

interface Props {
  loading: boolean
  children: React.ReactNode
}

export default function PageTransition({ loading, children }: Props) {
  const [showLoader, setShowLoader] = useState(true)
  const [loaderOpacity, setLoaderOpacity] = useState(1)
  const [contentOpacity, setContentOpacity] = useState(0)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!loading && !hasLoaded.current) {
      hasLoaded.current = true
      // Fade out loader
      setLoaderOpacity(0)
      // After loader fades out, fade in content
      const timer = setTimeout(() => {
        setShowLoader(false)
        requestAnimationFrame(() => setContentOpacity(1))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [loading])

  if (showLoader) {
    return (
      <div
        className="transition-opacity duration-300 ease-out"
        style={{ opacity: loaderOpacity }}
      >
        <MatrixRainLoader />
      </div>
    )
  }

  return (
    <div
      className="transition-opacity duration-500 ease-out"
      style={{ opacity: contentOpacity }}
    >
      {children}
    </div>
  )
}
