"use client"

import * as React from "react"
import { X, AlertTriangle, Trash2, Ban, LogOut, AlertCircle } from "lucide-react"

export type ConfirmModalVariant = "danger" | "warning" | "info"

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmModalVariant
  loading?: boolean
  icon?: "delete" | "suspend" | "warning" | "logout" | "info"
}

const iconMap = {
  delete: Trash2,
  suspend: Ban,
  warning: AlertTriangle,
  logout: LogOut,
  info: AlertCircle,
}

const variantStyles = {
  danger: {
    iconBg: "bg-red-500/20",
    iconColor: "text-red-500",
    confirmBg: "bg-red-600 hover:bg-red-700",
    confirmText: "text-white",
  },
  warning: {
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-500",
    confirmBg: "bg-amber-600 hover:bg-amber-700",
    confirmText: "text-white",
  },
  info: {
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-500",
    confirmBg: "bg-blue-600 hover:bg-blue-700",
    confirmText: "text-white",
  },
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  icon = "warning",
}: ConfirmModalProps) {
  const Icon = iconMap[icon]
  const styles = variantStyles[variant]

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !loading) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, loading, onClose])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 fade-in-0 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-8 h-8 ${styles.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center text-white mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-white/60 text-center mb-6">
          {description}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 ${styles.confirmBg} ${styles.confirmText} rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for easier usage
export function useConfirmModal() {
  const [state, setState] = React.useState<{
    open: boolean
    config: Omit<ConfirmModalProps, "open" | "onClose" | "onConfirm"> & {
      onConfirm?: () => void | Promise<void>
    }
  }>({
    open: false,
    config: { title: "", description: "" },
  })
  const [loading, setLoading] = React.useState(false)

  const confirm = React.useCallback(
    (config: Omit<ConfirmModalProps, "open" | "onClose" | "onConfirm" | "loading"> & {
      onConfirm?: () => void | Promise<void>
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          open: true,
          config: {
            ...config,
            onConfirm: async () => {
              setLoading(true)
              try {
                await config.onConfirm?.()
                resolve(true)
              } finally {
                setLoading(false)
                setState((prev) => ({ ...prev, open: false }))
              }
            },
          },
        })

        // Store the reject handler for cancel
        const handleClose = () => {
          resolve(false)
          setState((prev) => ({ ...prev, open: false }))
        }
        setState((prev) => ({
          ...prev,
          config: { ...prev.config, _handleClose: handleClose } as typeof prev.config,
        }))
      })
    },
    []
  )

  const close = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  const Modal = React.useCallback(
    () => (
      <ConfirmModal
        open={state.open}
        onClose={close}
        onConfirm={() => state.config.onConfirm?.()}
        title={state.config.title}
        description={state.config.description}
        confirmText={state.config.confirmText}
        cancelText={state.config.cancelText}
        variant={state.config.variant}
        icon={state.config.icon}
        loading={loading}
      />
    ),
    [state, close, loading]
  )

  return { confirm, close, Modal, isOpen: state.open }
}
