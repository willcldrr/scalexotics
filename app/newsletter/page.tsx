"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewsletterPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !validateEmail(email)) {
      setError("Enter a valid email address")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("https://willcldrr.app.n8n.cloud/webhook/add-subscriber", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to subscribe")
      }

      setIsSubmitted(true)
      setEmail("")
    } catch (err) {
      setError("Something went wrong. Try again in a moment.")
      console.error("Newsletter subscription error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <a href="/" className="inline-flex items-center justify-center gap-2" style={{ fontFamily: "Anton, sans-serif" }}>
          <img src="/logo.png" alt="Scale Exotics" className="h-10 w-10" />
          <span className="text-3xl font-bold tracking-wider">SCALE</span>
          <span className="text-3xl font-bold tracking-wider" style={{ color: "#326FF5" }}>
            EXOTICS
          </span>
        </a>

        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-6 space-y-4">
          <h1 className="text-2xl font-semibold">Join the newsletter</h1>
          <p className="text-sm text-muted-foreground">
            Insights on growing your exotic rental fleet, sent occasionally.
          </p>

          {isSubmitted ? (
            <div className="space-y-2">
              <p className="text-lg font-medium">You're in.</p>
              <p className="text-sm text-muted-foreground">Watch your inbox for the next drop.</p>
              <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                Add another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="text-left space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(error)}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

