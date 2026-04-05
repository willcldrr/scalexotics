"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Trash2, ChevronDown, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface BulkActionsProps {
  selectedIds: string[]
  onClearSelection: () => void
  onActionComplete: () => void
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "text-amber-400" },
  { value: "confirmed", label: "Confirmed", color: "text-emerald-400" },
  { value: "completed", label: "Completed", color: "text-blue-400" },
  { value: "cancelled", label: "Cancelled", color: "text-red-400" },
]

export function BulkActions({
  selectedIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (selectedIds.length === 0) return null

  async function handleBulkStatusUpdate(status: string) {
    setLoading(true)
    try {
      const response = await fetch("/api/bookings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          bookingIds: selectedIds,
          status,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update bookings")
      }

      if (data.failureCount === 0) {
        toast.success(
          `Updated ${data.successCount} ${data.successCount === 1 ? "booking" : "bookings"} to "${status}"`
        )
      } else {
        toast.warning(
          `${data.successCount} updated, ${data.failureCount} failed`
        )
      }

      onActionComplete()
      onClearSelection()
    } catch (error: any) {
      toast.error(error.message || "Failed to update bookings")
    } finally {
      setLoading(false)
    }
  }

  async function handleBulkDelete() {
    setLoading(true)
    try {
      const response = await fetch("/api/bookings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          bookingIds: selectedIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete bookings")
      }

      if (data.failureCount === 0) {
        toast.success(
          `Cancelled ${data.successCount} ${data.successCount === 1 ? "booking" : "bookings"}`
        )
      } else {
        toast.warning(
          `${data.successCount} cancelled, ${data.failureCount} failed`
        )
      }

      onActionComplete()
      onClearSelection()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete bookings")
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border bg-background/95 backdrop-blur px-4 py-2 shadow-sm">
        <Badge variant="secondary" className="text-xs font-medium">
          {selectedIds.length} selected
        </Badge>

        {/* Status change dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle className="size-4" />
              )}
              Change Status
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Set status to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleBulkStatusUpdate(opt.value)}
              >
                <span className={opt.color}>{opt.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete button */}
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => setShowDeleteConfirm(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Cancel Bookings
        </Button>

        {/* Clear selection */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClearSelection}
          disabled={loading}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Cancel Bookings"
        description={`Are you sure you want to cancel ${selectedIds.length} ${selectedIds.length === 1 ? "booking" : "bookings"}? This will set their status to "cancelled".`}
        confirmText="Cancel Bookings"
        cancelText="Go Back"
        variant="danger"
        icon="delete"
        loading={loading}
      />
    </>
  )
}
