"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Copy, Check, RefreshCw, Unlink, ExternalLink } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface TelegramStatus {
  connected: boolean
  username: string | null
  linkedAt: string | null
}

export default function TelegramSettings() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkCode, setLinkCode] = useState<string | null>(null)
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ open: false, title: "", message: "", onConfirm: () => {} })

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ open: true, title, message, onConfirm })
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/telegram/link-code")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error fetching Telegram status:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateCode = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/telegram/link-code", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setLinkCode(data.code)
        setCodeExpiry(new Date(data.expiresAt))
      }
    } catch (error) {
      console.error("Error generating code:", error)
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const disconnect = () => {
    showConfirm(
      "Disconnect Telegram",
      "Are you sure you want to disconnect Telegram?",
      async () => {
        setDisconnecting(true)
        try {
          const res = await fetch("/api/telegram/link-code", { method: "DELETE" })
          if (res.ok) {
            setStatus({ connected: false, username: null, linkedAt: null })
            setLinkCode(null)
          }
        } catch (error) {
          console.error("Error disconnecting:", error)
        } finally {
          setDisconnecting(false)
        }
      }
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const isCodeExpired = codeExpiry && new Date() > codeExpiry

  if (loading) {
    return (
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/10 rounded w-2/3" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#0088cc]/20 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-[#0088cc]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Telegram Bot</h3>
          <p className="text-sm text-white/50">Manage your dashboard via Telegram</p>
        </div>
      </div>

      {status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <div className="flex-1">
              <p className="font-medium text-emerald-400">Connected</p>
              <p className="text-sm text-white/50">
                {status.username ? `@${status.username}` : "Telegram account"} linked{" "}
                {status.linkedAt && formatDate(status.linkedAt)}
              </p>
            </div>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <Unlink className="w-4 h-4" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <h4 className="text-sm font-medium mb-2">What you can do:</h4>
            <ul className="text-sm text-white/60 space-y-1">
              <li>• "Show my vehicles" - View your fleet status</li>
              <li>• "Mark the Huracan as rented" - Update vehicle status</li>
              <li>• "Book the McLaren for John this weekend" - Create bookings</li>
              <li>• "Show new leads" - View your lead pipeline</li>
              <li>• "Give me a summary" - Get dashboard overview</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-white/60 text-sm">
            Connect your Telegram account to manage your dashboard on the go. Update vehicle status,
            create bookings, and check leads - all from Telegram.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              {linkCode && !isCodeExpired ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] font-mono text-2xl text-center tracking-[0.3em]">
                      {linkCode}
                    </div>
                    <button
                      onClick={copyCode}
                      className="p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-white/40 text-center">
                    Code expires in {Math.max(0, Math.round((codeExpiry!.getTime() - Date.now()) / 60000))} minutes
                  </p>
                </div>
              ) : (
                <button
                  onClick={generateCode}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#0088cc] hover:bg-[#0088cc]/80 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      Generate Link Code
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {linkCode && !isCodeExpired && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <h4 className="text-sm font-medium mb-2">How to connect:</h4>
              <ol className="text-sm text-white/60 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-xs flex items-center justify-center">1</span>
                  <span>
                    Open Telegram and search for your bot (or{" "}
                    <a
                      href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "YourBotUsername"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0088cc] hover:underline inline-flex items-center gap-1"
                    >
                      click here <ExternalLink className="w-3 h-3" />
                    </a>
                    )
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-xs flex items-center justify-center">2</span>
                  <span>Send /start to the bot</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-xs flex items-center justify-center">3</span>
                  <span>Send the 6-digit code shown above</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
        title={confirmModal.title}
        description={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="Disconnect"
        variant="destructive"
      />
    </div>
  )
}
