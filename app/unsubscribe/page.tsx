"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function UnsubscribeForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState("")

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleUnsubscribe = async (value: string) => {
    setError("")

    if (!value || !validateEmail(value)) {
      setError("Enter a valid email address")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("https://willcldrr.app.n8n.cloud/webhook/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: value }),
      })

      if (!response.ok) {
        throw new Error("Failed to unsubscribe")
      }

      setIsDone(true)
      setEmail("")
    } catch (error) {
      console.error("Unsubscribe error:", error)
      setError("Something went wrong. Try again in a moment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await handleUnsubscribe(email)
  }

  // If the URL contains an email query param, auto-unsubscribe without requiring input.
  useEffect(() => {
    const emailFromUrl = searchParams.get("email")
    if (!isDone && !isSubmitting && emailFromUrl && validateEmail(emailFromUrl)) {
      // Set it so the user can see which address is being used (optional)
      setEmail(emailFromUrl)
      void handleUnsubscribe(emailFromUrl)
    }
  }, [searchParams, isDone, isSubmitting])

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
          <h1 className="text-2xl font-semibold">Unsubscribe</h1>
          <p className="text-sm text-muted-foreground">
            Enter the email that receives our messages and we'll stop sending them.
          </p>

          {isDone ? (
            <div className="space-y-2">
              <p className="text-lg font-medium">You're unsubscribed.</p>
              <p className="text-sm text-muted-foreground">
                It can take a few minutes for this to update everywhere.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setIsDone(false)}>
                Undo / unsubscribe a different email
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

              <Button type="submit" className="w-full" variant="outline" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Unsubscribe"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <a href="/" className="inline-flex items-center justify-center gap-2" style={{ fontFamily: "Anton, sans-serif" }}>
            <img src="/logo.png" alt="Scale Exotics" className="h-10 w-10" />
            <span className="text-3xl font-bold tracking-wider">SCALE</span>
            <span className="text-3xl font-bold tracking-wider" style={{ color: "#326FF5" }}>
              EXOTICS
            </span>
          </a>
          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-6">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <UnsubscribeForm />
    </Suspense>
  )
}


