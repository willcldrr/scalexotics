"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"
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
  user_id: string
}

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  type: string
  status: string
  daily_rate: number
  image_url: string | null
  notes: string | null
  turo_ical_url: string | null
  last_turo_sync: string | null
  color: string | null
  created_at: string
  user_id: string
}

interface Booking {
  id: string
  vehicle_id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  start_date: string
  end_date: string
  status: string
  total_amount: number
  deposit_amount: number | null
  deposit_paid: boolean
  notes: string | null
  lead_id: string | null
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

const POLL_INTERVAL = 30000 // 30 seconds
const LOCAL_CACHE_KEY_PREFIX = 'velocity_dashboard_'

const DashboardCacheContext = createContext<DashboardCacheContextType | null>(null)

const getCacheKey = (userId: string) => `${LOCAL_CACHE_KEY_PREFIX}${userId}`

const loadCachedData = (userId: string): DashboardData | null => {
  if (typeof window === 'undefined') return null
  try {
    const cached = sessionStorage.getItem(getCacheKey(userId))
    if (!cached) return null
    const parsed = JSON.parse(cached)
    if (parsed.lastFetched && Date.now() - parsed.lastFetched < 30000) {
      return { ...parsed, isLoading: false, error: null }
    }
  } catch { /* ignore */ }
  return null
}

const saveCachedData = (userId: string, data: DashboardData) => {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(getCacheKey(userId), JSON.stringify({
      leads: data.leads.slice(0, 100),
      vehicles: data.vehicles.slice(0, 50),
      bookings: data.bookings.slice(0, 100),
      lastFetched: data.lastFetched,
    }))
  } catch { /* quota */ }
}

const clearAllCaches = () => {
  if (typeof window === 'undefined') return
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith(LOCAL_CACHE_KEY_PREFIX) || key === 'velocity_labs_dashboard_cache') {
      sessionStorage.removeItem(key)
    }
  }
  // Backwards compat: also clear any old data from localStorage
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(LOCAL_CACHE_KEY_PREFIX) || key === 'velocity_labs_dashboard_cache') {
      localStorage.removeItem(key)
    }
  }
}

export function DashboardCacheProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [data, setData] = useState<DashboardData>({
    leads: [], vehicles: [], bookings: [],
    lastFetched: null, isLoading: true, error: null,
  })
  const currentUserIdRef = useRef<string | null>(null)
  const mountedRef = useRef(true)
  const isFetchingRef = useRef(false)
  const initialLoadDoneRef = useRef(false)

  const fetchAllData = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mountedRef.current) { isFetchingRef.current = false; return }
      if (!user) {
        setData(prev => ({ ...prev, isLoading: false, error: "Not authenticated" }))
        isFetchingRef.current = false
        return
      }

      // Detect user change (impersonation) — clear stale data
      if (currentUserIdRef.current && currentUserIdRef.current !== user.id) {
        clearAllCaches()
      }
      currentUserIdRef.current = user.id

      const [leadsRes, vehiclesRes, bookingsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(500),
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

      if (!mountedRef.current) { isFetchingRef.current = false; return }

      const now = Date.now()
      const newLeads = (leadsRes.data || []) as Lead[]
      const newVehicles = (vehiclesRes.data || []) as Vehicle[]
      const newBookings = (bookingsRes.data || []).map((b: any) => ({
        ...b,
        vehicles: Array.isArray(b.vehicles) ? b.vehicles[0] : b.vehicles,
      })) as Booking[]

      // Only update state if data actually changed (prevents re-renders on background polls)
      setData(prev => {
        const leadsChanged = JSON.stringify(prev.leads.map(l => l.id + l.status)) !== JSON.stringify(newLeads.map(l => l.id + l.status))
        const vehiclesChanged = JSON.stringify(prev.vehicles.map(v => v.id + v.status)) !== JSON.stringify(newVehicles.map(v => v.id + v.status))
        const bookingsChanged = JSON.stringify(prev.bookings.map(b => b.id + b.status)) !== JSON.stringify(newBookings.map(b => b.id + b.status))

        if (!leadsChanged && !vehiclesChanged && !bookingsChanged && initialLoadDoneRef.current) {
          // Data hasn't changed — just update timestamp without triggering re-render cascade
          return { ...prev, lastFetched: now }
        }

        initialLoadDoneRef.current = true
        const newData: DashboardData = {
          leads: newLeads,
          vehicles: newVehicles,
          bookings: newBookings,
          lastFetched: now,
          isLoading: false,
          error: null,
        }
        saveCachedData(user.id, newData)
        return newData
      })
    } catch (err) {
      console.error("Dashboard fetch error:", err)
      if (mountedRef.current) {
        setData(prev => ({ ...prev, isLoading: false, error: "Failed to fetch data" }))
      }
    } finally {
      isFetchingRef.current = false
    }
  }, [supabase])

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true
    // Clear legacy cache
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('velocity_labs_dashboard_cache')
    }
    fetchAllData()
    return () => { mountedRef.current = false }
  }, [fetchAllData])

  // Poll every 5 seconds when tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchAllData()
      }
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchAllData])

  // Refresh on tab focus
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") fetchAllData()
    }
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [fetchAllData])

  // Real-time subscriptions — INSERT, UPDATE, DELETE on all tables
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mountedRef.current) return
      const userId = user.id

      channel = supabase
        .channel("dashboard-live-sync")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "vehicles", filter: `user_id=eq.${userId}` }, (payload) => {
          if (!mountedRef.current) return
          setData(prev => {
            if (prev.vehicles.some(v => v.id === (payload.new as Vehicle).id)) return prev
            return { ...prev, vehicles: [payload.new as Vehicle, ...prev.vehicles] }
          })
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "vehicles", filter: `user_id=eq.${userId}` }, (payload) => {
          if (!mountedRef.current) return
          setData(prev => ({ ...prev, vehicles: prev.vehicles.map(v => v.id === (payload.new as Vehicle).id ? { ...v, ...payload.new as Vehicle } : v) }))
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "vehicles", filter: `user_id=eq.${userId}` }, (payload) => {
          if (!mountedRef.current) return
          setData(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== (payload.old as Vehicle).id) }))
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings", filter: `user_id=eq.${userId}` }, (payload) => {
          if (!mountedRef.current) return
          setData(prev => {
            if (prev.bookings.some(b => b.id === (payload.new as Booking).id)) return prev
            return { ...prev, bookings: [payload.new as Booking, ...prev.bookings] }
          })
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `user_id=eq.${userId}` }, (payload) => {
          if (!mountedRef.current) return
          setData(prev => ({ ...prev, bookings: prev.bookings.map(b => b.id === (payload.new as Booking).id ? { ...b, ...payload.new as Booking } : b) }))
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "bookings", filter: `user_id=eq.${userId}` }, (payload) => {
          if (!mountedRef.current) return
          setData(prev => ({ ...prev, bookings: prev.bookings.filter(b => b.id !== (payload.old as Booking).id) }))
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads", filter: `user_id=eq.${userId}` }, (payload) => {
          if (!mountedRef.current) return
          setData(prev => {
            if (prev.leads.some(l => l.id === (payload.new as Lead).id)) return prev
            return { ...prev, leads: [payload.new as Lead, ...prev.leads] }
          })
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads", filter: `user_id=eq.${userId}` }, (payload) => {
          if (!mountedRef.current) return
          setData(prev => ({ ...prev, leads: prev.leads.map(l => l.id === (payload.new as Lead).id ? { ...l, ...payload.new as Lead } : l) }))
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "leads", filter: `user_id=eq.${userId}` }, (payload) => {
          if (!mountedRef.current) return
          setData(prev => ({ ...prev, leads: prev.leads.filter(l => l.id !== (payload.old as Lead).id) }))
        })
        .subscribe()
    }

    setup()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [supabase])

  const refreshData = useCallback(async () => { await fetchAllData() }, [fetchAllData])

  const refreshLeads = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: leads } = await supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500)
    setData(prev => ({ ...prev, leads: leads || [], lastFetched: Date.now() }))
  }, [supabase])

  const refreshVehicles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: vehicles } = await supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    setData(prev => ({ ...prev, vehicles: vehicles || [], lastFetched: Date.now() }))
  }, [supabase])

  const refreshBookings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*, vehicles(*)")
      .eq("user_id", user.id).order("start_date", { ascending: false }).limit(500)
    const bookings = (bookingsData || []).map((b: any) => ({ ...b, vehicles: Array.isArray(b.vehicles) ? b.vehicles[0] : b.vehicles })) as Booking[]
    setData(prev => ({ ...prev, bookings, lastFetched: Date.now() }))
  }, [supabase])

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setData(prev => ({ ...prev, leads: prev.leads.map(l => l.id === id ? { ...l, ...updates } : l) }))
  }, [])
  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setData(prev => ({ ...prev, vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...updates } : v) }))
  }, [])
  const updateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    setData(prev => ({ ...prev, bookings: prev.bookings.map(b => b.id === id ? { ...b, ...updates } : b) }))
  }, [])
  const addLead = useCallback((lead: Lead) => {
    setData(prev => ({ ...prev, leads: [lead, ...prev.leads] }))
  }, [])
  const addVehicle = useCallback((vehicle: Vehicle) => {
    setData(prev => ({ ...prev, vehicles: [vehicle, ...prev.vehicles] }))
  }, [])
  const addBooking = useCallback((booking: Booking) => {
    setData(prev => ({ ...prev, bookings: [booking, ...prev.bookings] }))
  }, [])
  const removeLead = useCallback((id: string) => {
    setData(prev => ({ ...prev, leads: prev.leads.filter(l => l.id !== id) }))
  }, [])
  const removeVehicle = useCallback((id: string) => {
    setData(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== id) }))
  }, [])
  const removeBooking = useCallback((id: string) => {
    setData(prev => ({ ...prev, bookings: prev.bookings.filter(b => b.id !== id) }))
  }, [])

  return (
    <DashboardCacheContext.Provider value={{
      data, refreshData, refreshLeads, refreshVehicles, refreshBookings,
      updateLead, updateVehicle, updateBooking,
      addLead, addVehicle, addBooking,
      removeLead, removeVehicle, removeBooking,
    }}>
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
