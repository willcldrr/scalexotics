"use client"

import { useState, useEffect } from "react"
import { Instagram, Unlink, CheckCircle, AlertCircle, ArrowRight, Key, ExternalLink, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ConfirmModal } from "@/components/ui/confirm-modal"

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
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ open: false, title: "", message: "", onConfirm: () => {} })

  // Manual connect state
  const [showManualConnect, setShowManualConnect] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const [connecting, setConnecting] = useState(false)

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ open: true, title, message, onConfirm })
  }

  const supabase = createClient()

  useEffect(() => {
    fetchConnection()

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
      // No connection found
    } finally {
      setLoading(false)
    }
  }

  const handleManualConnect = async () => {
    if (!manualToken.trim()) return
    setConnecting(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("Not authenticated. Please refresh and try again.")
        return
      }

      const res = await fetch("/api/instagram/connect-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ accessToken: manualToken.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error + (data.hint ? ` — ${data.hint}` : ""))
        return
      }

      setSuccess(true)
      setManualToken("")
      setShowManualConnect(false)
      fetchConnection()
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError("Failed to connect. Please check the token and try again.")
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    showConfirm(
      "Disconnect Instagram",
      "Your AI will stop responding to DMs. Are you sure?",
      async () => {
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
    )
  }

  if (loading) {
    return (
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.3),0_0_15px_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.12] p-8">
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
    <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.3),0_0_15px_rgba(255,255,255,0.03)] transition-all duration-300 hover:border-white/[0.12] p-8">
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
                  {connection.page_name && <span className="text-white/40"> via {connection.page_name}</span>}
                </p>
              </div>
            </div>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50"
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

          {/* Connect with Token */}
          <div className="space-y-4">
            <button
              onClick={() => setShowManualConnect(!showManualConnect)}
              className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white rounded-xl font-semibold text-lg shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <Instagram className="w-6 h-6" />
              Connect Instagram
              {showManualConnect ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showManualConnect && (
              <div className="space-y-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white/80">How to get your access token:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</div>
                      <div className="text-sm text-white/60">
                        Open the{" "}
                        <a
                          href="https://developers.facebook.com/tools/explorer/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          Graph API Explorer <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</div>
                      <p className="text-sm text-white/60">
                        Select your Meta app from the dropdown at the top
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</div>
                      <p className="text-sm text-white/60">
                        Click <span className="text-white/80 font-medium">Generate Access Token</span> and approve all permissions
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</div>
                      <p className="text-sm text-white/60">
                        Copy the token and paste it below
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <p className="text-xs text-white/40">Make sure these permissions are selected: <span className="text-white/60">pages_show_list, instagram_basic, instagram_manage_messages, pages_messaging, pages_manage_metadata</span></p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="password"
                      placeholder="Paste your access token here..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualConnect()}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all duration-300"
                    />
                  </div>
                  <button
                    onClick={handleManualConnect}
                    disabled={connecting || !manualToken.trim()}
                    className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </button>
                </div>
              </div>
            )}
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

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        title={confirmModal.title}
        description={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="Disconnect"
        variant="danger"
      />
    </div>
  )
}
