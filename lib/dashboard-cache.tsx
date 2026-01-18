"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string
  status: string
  source: string | null
  vehicle_interest: string | null
  notes: string | null
  created_at: string
  updated_at: string
  user_id: string
}

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  vin: string | null
  license_plate: string | null
  color: string | null
  type: string
  status: string
  daily_rate: number
  image_url: string | null
  created_at: string
  user_id: string
}

interface Booking {
  id: string
  vehicle_id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  start_date: string
  end_date: string
  status: string
  total_amount: number
  deposit_amount: number | null
  deposit_paid: boolean
  notes: string | null
  created_at: string
  user_id: string
  vehicles?: Vehicle
}

interface DashboardData {
  leads: Lead[]
  vehicles: Vehicle[]
  bookings: Booking[]
  lastFetched: number | null
  isLoading: boolean
  error: string | null
}

interface DashboardCacheContextType {
  data: DashboardData
  refreshData: () => Promise<void>
  refreshLeads: () => Promise<void>
  refreshVehicles: () => Promise<void>
  refreshBookings: () => Promise<void>
  updateLead: (id: string, updates: Partial<Lead>) => void
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void
  updateBooking: (id: string, updates: Partial<Booking>) => void
  addLead: (lead: Lead) => void
  addVehicle: (vehicle: Vehicle) => void
  addBooking: (booking: Booking) => void
  removeLead: (id: string) => void
  removeVehicle: (id: string) => void
  removeBooking: (id: string) => void
}

const CACHE_DURATION = 30000 // 30 seconds - data is considered fresh for this long

const DashboardCacheContext = createContext<DashboardCacheContextType | null>(null)

export function DashboardCacheProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [data, setData] = useState<DashboardData>({
    leads: [],
    vehicles: [],
    bookings: [],
    lastFetched: null,
    isLoading: true,
    error: null,
  })

  const fetchAllData = useCallback(async (force = false) => {
    // Skip if data is fresh and not forced
    if (!force && data.lastFetched && Date.now() - data.lastFetched < CACHE_DURATION) {
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setData(prev => ({ ...prev, isLoading: false, error: "Not authenticated" }))
      return
    }

    setData(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch all data in parallel for speed
      const [leadsRes, vehiclesRes, bookingsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(500), // Limit to prevent huge payloads
        supabase
          .from("vehicles")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("*, vehicles(*)")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false })
          .limit(500),
      ])

      setData({
        leads: leadsRes.data || [],
        vehicles: vehiclesRes.data || [],
        bookings: bookingsRes.data || [],
        lastFetched: Date.now(),
        isLoading: false,
        error: null,
      })
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to fetch data",
      }))
    }
  }, [data.lastFetched, supabase])

  // Initial fetch
  useEffect(() => {
    fetchAllData()
  }, [])

  // Background refresh every 30 seconds if tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchAllData()
      }
    }, CACHE_DURATION)

    return () => clearInterval(interval)
  }, [fetchAllData])

  // Refresh when tab becomes visible if data is stale
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchAllData()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [fetchAllData])

  const refreshData = useCallback(async () => {
    await fetchAllData(true)
  }, [fetchAllData])

  const refreshLeads = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500)

    setData(prev => ({ ...prev, leads: leads || [], lastFetched: Date.now() }))
  }, [supabase])

  const refreshVehicles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    setData(prev => ({ ...prev, vehicles: vehicles || [], lastFetched: Date.now() }))
  }, [supabase])

  const refreshBookings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, vehicles(*)")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .limit(500)

    setData(prev => ({ ...prev, bookings: bookings || [], lastFetched: Date.now() }))
  }, [supabase])

  // Optimistic updates - update local state immediately without refetching
  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setData(prev => ({
      ...prev,
      leads: prev.leads.map(l => l.id === id ? { ...l, ...updates } : l),
    }))
  }, [])

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...updates } : v),
    }))
  }, [])

  const updateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    setData(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => b.id === id ? { ...b, ...updates } : b),
    }))
  }, [])

  const addLead = useCallback((lead: Lead) => {
    setData(prev => ({
      ...prev,
      leads: [lead, ...prev.leads],
    }))
  }, [])

  const addVehicle = useCallback((vehicle: Vehicle) => {
    setData(prev => ({
      ...prev,
      vehicles: [vehicle, ...prev.vehicles],
    }))
  }, [])

  const addBooking = useCallback((booking: Booking) => {
    setData(prev => ({
      ...prev,
      bookings: [booking, ...prev.bookings],
    }))
  }, [])

  const removeLead = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      leads: prev.leads.filter(l => l.id !== id),
    }))
  }, [])

  const removeVehicle = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id),
    }))
  }, [])

  const removeBooking = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      bookings: prev.bookings.filter(b => b.id !== id),
    }))
  }, [])

  return (
    <DashboardCacheContext.Provider
      value={{
        data,
        refreshData,
        refreshLeads,
        refreshVehicles,
        refreshBookings,
        updateLead,
        updateVehicle,
        updateBooking,
        addLead,
        addVehicle,
        addBooking,
        removeLead,
        removeVehicle,
        removeBooking,
      }}
    >
      {children}
    </DashboardCacheContext.Provider>
  )
}

export function useDashboardCache() {
  const context = useContext(DashboardCacheContext)
  if (!context) {
    throw new Error("useDashboardCache must be used within DashboardCacheProvider")
  }
  return context
}
