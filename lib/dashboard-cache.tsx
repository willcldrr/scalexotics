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
const LOCAL_CACHE_KEY = 'scale_exotics_dashboard_cache'
const LOCAL_CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes max age for localStorage cache

const DashboardCacheContext = createContext<DashboardCacheContextType | null>(null)

// Load cached data from localStorage for instant first render
const loadCachedData = (): DashboardData | null => {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY)
    if (!cached) return null
    const parsed = JSON.parse(cached)
    // Only use cache if it's less than 5 minutes old
    if (parsed.lastFetched && Date.now() - parsed.lastFetched < LOCAL_CACHE_MAX_AGE) {
      return { ...parsed, isLoading: true } // Still show loading while we revalidate
    }
  } catch {
    // Invalid cache, ignore
  }
  return null
}

// Save data to localStorage for future instant loads
const saveCachedData = (data: DashboardData) => {
  if (typeof window === 'undefined') return
  try {
    // Only cache essential fields, not the full data to save space
    const toCache = {
      leads: data.leads.slice(0, 100), // Only cache first 100 items
      vehicles: data.vehicles.slice(0, 50),
      bookings: data.bookings.slice(0, 100),
      lastFetched: data.lastFetched,
    }
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(toCache))
  } catch {
    // Quota exceeded or other error, ignore
  }
}

export function DashboardCacheProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  // Initialize with cached data if available for instant first render
  const [data, setData] = useState<DashboardData>(() => {
    const cached = loadCachedData()
    return cached || {
      leads: [],
      vehicles: [],
      bookings: [],
      lastFetched: null,
      isLoading: true,
      error: null,
    }
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
      // OPTIMIZED: Only select columns actually needed for dashboard
      const [leadsRes, vehiclesRes, bookingsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, name, email, phone, status, source, vehicle_interest, notes, created_at, user_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("vehicles")
          .select("id, name, make, model, year, type, status, daily_rate, image_url, created_at, user_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("id, vehicle_id, customer_name, customer_email, customer_phone, start_date, end_date, status, total_amount, deposit_amount, deposit_paid, notes, created_at, user_id, vehicles(id, name, make, model, year, image_url, daily_rate)")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false })
          .limit(500),
      ])

      const newData = {
        leads: leadsRes.data || [],
        vehicles: vehiclesRes.data || [],
        bookings: bookingsRes.data || [],
        lastFetched: Date.now(),
        isLoading: false,
        error: null,
      }
      setData(newData)
      // Persist to localStorage for instant future loads
      saveCachedData(newData)
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
      .select("id, vehicle_id, customer_name, customer_email, customer_phone, start_date, end_date, status, total_amount, deposit_amount, deposit_paid, notes, created_at, user_id, vehicles(id, name, make, model, year, image_url, daily_rate)")
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
