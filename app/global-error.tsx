"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>
          Application error
        </h1>
        <p style={{ marginTop: "0.75rem", maxWidth: "28rem", color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
          A critical error occurred. Please refresh the page.
        </p>
        {error.digest && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          style={{
            marginTop: "1.5rem",
            borderRadius: "0.375rem",
            background: "#fff",
            color: "#000",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  )
}
