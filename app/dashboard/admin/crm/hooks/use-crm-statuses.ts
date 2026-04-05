"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { crmStatusOptions as defaultStatuses } from "../lib/crm-status"

export interface CRMStatus {
  id: string
  value: string
  label: string
  description: string | null
  color: string
  bg_color: string
  sort_order: number
  is_active: boolean
  is_won: boolean
  is_lost: boolean
  show_in_pipeline: boolean
  created_at: string
  updated_at: string
}

// Convert database format to the format used by components
export interface CRMStatusOption {
  value: string
  label: string
  color: string
  bgColor: string
  description: string
}

export function useCRMStatuses() {
  const supabase = createClient()
  const [statuses, setStatuses] = useState<CRMStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatuses = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("crm_statuses")
      .select("*")
      .order("sort_order", { ascending: true })

    if (fetchError) {
      // If table doesn't exist or other error, use defaults
      console.warn("Failed to fetch CRM statuses, using defaults:", fetchError)
      setError(fetchError.message)
      setStatuses([])
    } else {
      setStatuses(data || [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  // Convert to component format
  const statusOptions: CRMStatusOption[] = statuses.length > 0
    ? statuses.map((s) => ({
        value: s.value,
        label: s.label,
        color: s.color,
        bgColor: s.bg_color,
        description: s.description || "",
      }))
    : defaultStatuses

  // Get pipeline statuses (for kanban)
  const pipelineStatuses = statuses.length > 0
    ? statuses.filter((s) => s.show_in_pipeline).map((s) => s.value)
    : ["not_contacted", "contacted", "interested", "demo_scheduled", "closed_won", "closed_lost"]

  // Get active statuses
  const activeStatuses = statuses.length > 0
    ? statuses.filter((s) => s.is_active).map((s) => s.value)
    : ["not_contacted", "contacted", "interested", "demo_scheduled"]

  // Get won/lost statuses
  const wonStatuses = statuses.length > 0
    ? statuses.filter((s) => s.is_won).map((s) => s.value)
    : ["closed_won"]

  const lostStatuses = statuses.length > 0
    ? statuses.filter((s) => s.is_lost).map((s) => s.value)
    : ["closed_lost", "not_interested", "bounced"]

  // Helper to get status info
  const getStatusOption = (statusValue: string): CRMStatusOption | undefined => {
    return statusOptions.find((s) => s.value === statusValue)
  }

  const getStatusColor = (statusValue: string): string => {
    const option = getStatusOption(statusValue)
    return option ? `${option.bgColor} ${option.color}` : "bg-white/5 text-white/40"
  }

  const getStatusLabel = (statusValue: string): string => {
    return getStatusOption(statusValue)?.label || statusValue
  }

  // CRUD operations
  const createStatus = async (status: Omit<CRMStatus, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase
      .from("crm_statuses")
      .insert(status)
      .select()
      .single()

    if (error) throw error
    await fetchStatuses()
    return data
  }

  const updateStatus = async (id: string, updates: Partial<CRMStatus>) => {
    const { data, error } = await supabase
      .from("crm_statuses")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    await fetchStatuses()
    return data
  }

  const deleteStatus = async (id: string) => {
    const { error } = await supabase
      .from("crm_statuses")
      .delete()
      .eq("id", id)

    if (error) throw error
    await fetchStatuses()
  }

  const reorderStatuses = async (statusIds: string[]) => {
    // Update sort_order for each status
    const updates = statusIds.map((id, index) => ({
      id,
      sort_order: index + 1,
    }))

    for (const update of updates) {
      await supabase
        .from("crm_statuses")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id)
    }

    await fetchStatuses()
  }

  return {
    statuses,
    statusOptions,
    pipelineStatuses,
    activeStatuses,
    wonStatuses,
    lostStatuses,
    loading,
    error,
    refetch: fetchStatuses,
    getStatusOption,
    getStatusColor,
    getStatusLabel,
    createStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
  }
}
