"use client"

import { useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*"

interface UseRealtimeSubscriptionOptions<T extends Record<string, unknown>> {
  /** The database table to subscribe to */
  table: string
  /** Database schema (defaults to "public") */
  schema?: string
  /** Event type to listen for (defaults to "*" for all events) */
  event?: PostgresChangeEvent
  /** Optional filter string (e.g., "user_id=eq.123") */
  filter?: string
  /** Callback when a row is inserted */
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void
  /** Callback when a row is updated */
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void
  /** Callback when a row is deleted */
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void
  /** Callback for any change (called in addition to specific handlers) */
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void
  /** Whether the subscription is enabled (defaults to true) */
  enabled?: boolean
}

/**
 * Hook for subscribing to Supabase Realtime postgres_changes
 *
 * @example
 * ```tsx
 * useRealtimeSubscription<Vehicle>({
 *   table: "vehicles",
 *   filter: `user_id=eq.${userId}`,
 *   onInsert: (payload) => setVehicles(prev => [payload.new, ...prev]),
 *   onUpdate: (payload) => setVehicles(prev =>
 *     prev.map(v => v.id === payload.new.id ? payload.new : v)
 *   ),
 *   onDelete: (payload) => setVehicles(prev =>
 *     prev.filter(v => v.id !== payload.old.id)
 *   ),
 * })
 * ```
 */
export function useRealtimeSubscription<T extends Record<string, unknown>>({
  table,
  schema = "public",
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeSubscriptionOptions<T>) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Store callbacks in refs to avoid re-subscribing when they change
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  const onDeleteRef = useRef(onDelete)
  const onChangeRef = useRef(onChange)

  // Update refs when callbacks change
  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete
    onChangeRef.current = onChange
  }, [onInsert, onUpdate, onDelete, onChange])

  const handleChange = useCallback((payload: RealtimePostgresChangesPayload<T>) => {
    // Call specific handlers based on event type
    if (payload.eventType === "INSERT" && onInsertRef.current) {
      onInsertRef.current(payload)
    } else if (payload.eventType === "UPDATE" && onUpdateRef.current) {
      onUpdateRef.current(payload)
    } else if (payload.eventType === "DELETE" && onDeleteRef.current) {
      onDeleteRef.current(payload)
    }

    // Always call onChange if provided
    if (onChangeRef.current) {
      onChangeRef.current(payload)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      // Clean up existing channel if disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    // Create unique channel name
    const channelName = `realtime-${table}-${filter || "all"}-${Date.now()}`

    // Build channel configuration
    const channelConfig: {
      event: PostgresChangeEvent
      schema: string
      table: string
      filter?: string
    } = {
      event,
      schema,
      table,
    }

    if (filter) {
      channelConfig.filter = filter
    }

    // Create and subscribe to channel
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        channelConfig,
        handleChange as (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => void
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime] Subscribed to ${table}${filter ? ` (${filter})` : ""}`)
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[Realtime] Error subscribing to ${table}`)
        }
      })

    channelRef.current = channel

    // Cleanup on unmount or when dependencies change
    return () => {
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from ${table}`)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, schema, event, filter, enabled, supabase, handleChange])

  return channelRef.current
}

/**
 * Helper type for extracting the record type from a payload
 */
export type RealtimeRecord<T> = T extends RealtimePostgresChangesPayload<infer R> ? R : never
