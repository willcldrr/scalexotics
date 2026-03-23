"use client"

import { useState, useEffect } from "react"
import { Instagram, Unlink, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface InstagramConnection {
  id: string
  instagram_account_id: string
  instagram_username: string | null
  page_name: string | null
  token_expires_at: string
  connected_at: string
  is_active: boolean
}

export default function InstagramSettings() {
  const [connection, setConnection] = useState<InstagramConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchConnection()

    // Check for URL params (success/error from OAuth)
    const params = new URLSearchParams(window.location.search)
    let successTimeout: ReturnType<typeof setTimeout> | undefined

    if (params.get("instagram_success")) {
      setSuccess(true)
      window.history.replaceState({}, "", window.location.pathname)
      successTimeout = setTimeout(() => setSuccess(false), 5000)
    }
    if (params.get("instagram_error")) {
      setError(decodeURIComponent(params.get("instagram_error") || "Connection failed"))
      window.history.replaceState({}, "", window.location.pathname)
    }

    return () => {
      if (successTimeout) clearTimeout(successTimeout)
    }
  }, [])

  const fetchConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("instagram_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (data && !error) {
        setConnection(data)
      }
    } catch (err) {
      // No connection found - that's fine
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    if (!confirm("Disconnect Instagram? Your AI will stop responding to DMs.")) return

    setDisconnecting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from("instagram_connections")
        .update({ is_active: false })
        .eq("user_id", user.id)

      setConnection(null)
    } catch (err) {
      console.error("Error disconnecting:", err)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-8">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl" />
          <div className="space-y-2">
            <div className="h-5 bg-white/10 rounded w-32" />
            <div className="h-4 bg-white/10 rounded w-48" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
          <Instagram className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Instagram DMs</h3>
          <p className="text-white/50">AI-powered responses to your Instagram messages</p>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-400">Instagram connected! Your AI will now respond to DMs automatically.</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Connection failed</p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400">&times;</button>
          </div>
        </div>
      )}

      {connection ? (
        /* Connected State */
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              <div>
                <p className="font-semibold text-emerald-400">Connected</p>
                <p className="text-white/60">
                  @{connection.instagram_username || "your account"}
                </p>
              </div>
            </div>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <Unlink className="w-4 h-4" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>

          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-white/80 mb-3">Your AI assistant will now:</p>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Respond to new DMs automatically
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Answer questions about your vehicles and availability
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Collect customer info and create leads
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Send payment links when ready to book
              </li>
            </ul>
          </div>
        </div>
      ) : (
        /* Not Connected State */
        <div className="space-y-6">
          <p className="text-white/70">
            Connect your Instagram to let your AI assistant handle DMs. When customers message you, the AI responds instantly with info about your vehicles and helps them book.
          </p>

          {/* Connect Button */}
          <a
            href="/api/instagram/auth"
            className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white rounded-xl transition-opacity font-semibold text-lg"
          >
            <Instagram className="w-6 h-6" />
            Connect Instagram
            <ArrowRight className="w-5 h-5" />
          </a>

          {/* Simple Steps */}
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm text-white/50 mb-4">When you click Connect:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium">1</div>
                <p className="text-white/70">Log in to Facebook (if not already)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium">2</div>
                <p className="text-white/70">Select your Instagram Business account</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium">3</div>
                <p className="text-white/70">Click Allow to connect</p>
              </div>
            </div>
          </div>

          {/* Requirements Note */}
          <p className="text-sm text-white/40">
            Requires an Instagram Business or Creator account linked to a Facebook Page.{" "}
            <a
              href="https://help.instagram.com/502981923235522"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              How to switch
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
