"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Send, Loader2, MessageSquare, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface BulkSmsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipients: { id: string; name: string; phone: string }[]
}

const MAX_MESSAGE_LENGTH = 1600

export function BulkSmsDialog({
  open,
  onOpenChange,
  recipients,
}: BulkSmsDialogProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    total: number
    successCount: number
    failureCount: number
  } | null>(null)

  const characterCount = message.length
  const isOverLimit = characterCount > MAX_MESSAGE_LENGTH
  const canSend = message.trim().length > 0 && !isOverLimit && recipients.length > 0

  async function handleSend() {
    if (!canSend) return

    setSending(true)
    setResult(null)

    try {
      const response = await fetch("/api/sms/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: recipients.map((r) => r.phone),
          message: message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send bulk SMS")
      }

      setResult({
        total: data.total,
        successCount: data.successCount,
        failureCount: data.failureCount,
      })

      if (data.failureCount === 0) {
        toast.success(`SMS sent to ${data.successCount} recipients`)
      } else {
        toast.warning(
          `SMS sent: ${data.successCount} succeeded, ${data.failureCount} failed`
        )
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send bulk SMS")
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    if (sending) return
    setMessage("")
    setResult(null)
    onOpenChange(false)
  }

  const progressValue = result
    ? Math.round((result.successCount / result.total) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Bulk SMS
          </DialogTitle>
          <DialogDescription>
            Send a text message to {recipients.length} selected{" "}
            {recipients.length === 1 ? "lead" : "leads"}.
          </DialogDescription>
        </DialogHeader>

        {/* Recipients preview */}
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {recipients.slice(0, 10).map((r) => (
            <Badge key={r.id} variant="secondary" className="text-xs">
              {r.name}
            </Badge>
          ))}
          {recipients.length > 10 && (
            <Badge variant="outline" className="text-xs">
              +{recipients.length - 10} more
            </Badge>
          )}
        </div>

        {/* Message input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            className="min-h-[120px] resize-none"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {recipients.length} {recipients.length === 1 ? "recipient" : "recipients"}
            </span>
            <span className={isOverLimit ? "text-destructive font-medium" : ""}>
              {characterCount}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

        {/* Results display */}
        {result && (
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Results</span>
              <span className="text-muted-foreground">
                {result.successCount}/{result.total} sent
              </span>
            </div>
            <Progress value={progressValue} />
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-500">
                {result.successCount} succeeded
              </span>
              {result.failureCount > 0 && (
                <span className="text-destructive">
                  {result.failureCount} failed
                </span>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleSend} disabled={!canSend || sending}>
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send to {recipients.length}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
