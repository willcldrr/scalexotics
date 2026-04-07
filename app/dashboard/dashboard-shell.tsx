"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardCacheProvider } from "@/lib/dashboard-cache"
import { useBranding } from "@/lib/branding-context"
import { getSidebarSettings, getDefaultSidebarSettings, SidebarSettings, SidebarDisplayMode } from "./settings/sidebar-settings"

const SESSION_TOKEN_KEY = 'velocity_labs_session_token'
import {
  LayoutDashboard,
  Users,
  Car,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bot,
  Shield,
  Building2,
  Home,
  CalendarDays,
  Sparkles,
  BarChart3,
} from "lucide-react"

// Ordered by frequency of use for rental fleet owners
const allNavItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, key: "overview", alwaysVisible: true },
  { name: "Leads", href: "/dashboard/leads", icon: Users, key: "leads" },
  { name: "Vehicles", href: "/dashboard/vehicles", icon: Car, key: "vehicles" },
  { name: "Bookings", href: "/dashboard/bookings", icon: CalendarDays, key: "bookings" },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot, key: "ai-assistant" },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, key: "analytics" },
]

const adminNavItems = [
  { name: "Velocity AI", href: "/dashboard/velocity-ai", icon: Sparkles, key: "velocity-ai" },
  { name: "Admin", href: "/dashboard/admin", icon: Shield, key: "admin" },
  { name: "CRM", href: "/dashboard/admin/crm", icon: Building2, key: "admin-crm" },
]

// Settings is always at the bottom
const settingsItem = { name: "Settings", href: "/dashboard/settings", icon: Settings, key: "settings" }

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const branding = useBranding()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sidebarSettings, setSidebarSettings] = useState<SidebarSettings>(getDefaultSidebarSettings())
  const [impersonatingUser, setImpersonatingUser] = useState<{ id: string; email: string; name: string } | null>(null)

  // Sidebar is always collapsed on desktop, expands on hover to reveal labels
  const [sidebarHovered, setSidebarHovered] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch profile using anon client for basic info
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, company_name, phone, created_at")
          .eq("id", user.id)
          .single()

        // Fetch admin status from API (uses service role, bypasses RLS)
        try {
          const authStatusRes = await fetch("/api/auth/status")
          if (authStatusRes.ok) {
            const authStatus = await authStatusRes.json()
            // Merge admin status with profile data
            setProfile({
              ...profile,
              id: user.id,
              is_admin: authStatus.isAdmin === true,
            })
          } else {
            // Fallback: set profile without admin status
            setProfile({ ...profile, id: user.id, is_admin: false })
          }
        } catch (err) {
          console.error("[Dashboard] Error fetching auth status:", err)
          setProfile({ ...profile, id: user.id, is_admin: false })
        }
      }
    }
    getUser()

    // Load sidebar settings
    setSidebarSettings(getSidebarSettings())

    // Check if we're impersonating a user
    const impersonatingData = sessionStorage.getItem("impersonating_user")
    if (impersonatingData) {
      try {
        setImpersonatingUser(JSON.parse(impersonatingData))
      } catch {
        // Invalid data, ignore
      }
    }

    // Listen for settings changes
    const handleSettingsChange = (e: CustomEvent<SidebarSettings>) => {
      setSidebarSettings(e.detail)
    }
    window.addEventListener("sidebarSettingsChanged", handleSettingsChange as EventListener)

    return () => {
      window.removeEventListener("sidebarSettingsChanged", handleSettingsChange as EventListener)
    }
  }, [])

  // Prefetch all dashboard routes on mount for faster navigation
  useEffect(() => {
    const routesToPrefetch = [
      "/dashboard",
      "/dashboard/leads",
      "/dashboard/vehicles",
      "/dashboard/bookings",
      "/dashboard/ai-assistant",
      "/dashboard/ai-assistant/test",
      "/dashboard/settings",
    ]
    routesToPrefetch.forEach(route => router.prefetch(route))
  }, [router])

  // Filter nav items based on settings
  const navItems = allNavItems.filter(item =>
    item.alwaysVisible || sidebarSettings[item.key] === true
  )

  // Get current page title for mobile header
  const getPageTitle = () => {
    const allItems = [...allNavItems, ...adminNavItems]
    const current = allItems.find(item =>
      pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    )
    return current?.name || "Dashboard"
  }

  // Swipe to open menu
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const sidebarOpenRef = useRef(sidebarOpen)

  // Keep ref in sync with state
  useEffect(() => {
    sidebarOpenRef.current = sidebarOpen
  }, [sidebarOpen])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      const touchEndX = e.touches[0].clientX
      const touchEndY = e.touches[0].clientY
      const deltaX = touchEndX - touchStartX.current
      const deltaY = touchEndY - touchStartY.current

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        // Swipe right from left edge to open (use ref to avoid dependency)
        if (deltaX > 0 && touchStartX.current < 30 && !sidebarOpenRef.current) {
          setSidebarOpen(true)
          touchStartX.current = null
        }
        // Swipe left to close
        if (deltaX < 0 && sidebarOpenRef.current) {
          setSidebarOpen(false)
          touchStartX.current = null
        }
      }
    }

    const handleTouchEnd = () => {
      touchStartX.current = null
      touchStartY.current = null
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: true })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

  // Bottom nav items for mobile (most important ones)
  const bottomNavItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Leads", href: "/dashboard/leads", icon: Users },
    { name: "Vehicles", href: "/dashboard/vehicles", icon: Car },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  // Raw sign out — clears everything and redirects to login
  const forceSignOut = useCallback(async () => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
    sessionStorage.removeItem("impersonating_user")
    sessionStorage.removeItem("admin_return_token")
    sessionStorage.removeItem("admin_return_session")
    await supabase.auth.signOut()
    window.location.href = "/login"
  }, [supabase])

  const exitImpersonation = useCallback(async () => {
    try {
      // Get the stored admin user ID
      const adminUserId = sessionStorage.getItem("admin_user_id")
      // Fallback: try old format
      let adminSessionStr = sessionStorage.getItem("admin_return_session")

      if (!adminUserId && !adminSessionStr) {
        forceSignOut()
        return
      }

      // 1. Clear ALL impersonation state and caches
      sessionStorage.removeItem("impersonating_user")
      sessionStorage.removeItem("admin_user_id")
      sessionStorage.removeItem("admin_return_token")
      sessionStorage.removeItem("admin_return_session")
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i)
        if (key && (key.startsWith("velocity_dashboard_") || key === "velocity_labs_dashboard_cache")) {
          sessionStorage.removeItem(key)
        }
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && (key.startsWith("velocity_dashboard_") || key === "velocity_labs_dashboard_cache")) {
          localStorage.removeItem(key)
        }
      }

      // 2. Sign out impersonated user
      await supabase.auth.signOut()

      // 3. Get a fresh admin session from the server
      if (adminUserId) {
        const res = await fetch("/api/admin/restore-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminUserId }),
        })

        if (res.ok) {
          const data = await res.json()
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          })
          window.location.href = "/dashboard/admin"
          return
        }
      }

      // 4. Fallback: try old stored tokens
      if (adminSessionStr) {
        try {
          const adminSession = JSON.parse(adminSessionStr)
          const { error } = await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token || "",
          })
          if (!error) {
            window.location.href = "/dashboard/admin"
            return
          }
        } catch { /* ignore */ }
      }

      // All methods failed
      window.location.href = "/login"
    } catch (error) {
      console.error("Error exiting impersonation:", error)
      forceSignOut()
    }
  }, [supabase, forceSignOut])

  // Smart sign out: if impersonating, return to admin; otherwise sign out fully
  const handleSignOut = useCallback(async () => {
    const impersonating = sessionStorage.getItem("impersonating_user")
    if (impersonating) {
      exitImpersonation()
    } else {
      forceSignOut()
    }
  }, [exitImpersonation, forceSignOut])

  // Prefetch critical routes on mount for faster navigation
  useEffect(() => {
    // Prefetch most common navigation targets
    const criticalRoutes = [
      "/dashboard",
      "/dashboard/leads",
      "/dashboard/vehicles",
      "/dashboard/settings",
    ]

    // Use requestIdleCallback for non-blocking prefetch
    const prefetchRoutes = () => {
      criticalRoutes.forEach(route => {
        router.prefetch(route)
      })
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let idleCallbackId: number | undefined

    if ('requestIdleCallback' in window) {
      idleCallbackId = (window as any).requestIdleCallback(prefetchRoutes)
    } else {
      // Fallback for Safari
      timeoutId = setTimeout(prefetchRoutes, 100)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (idleCallbackId && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleCallbackId)
      }
    }
  }, [router])

  // Note: Device session management (user_sessions table) is available but not active
  // The sessions API exists at /api/sessions for tracking devices and allowing "logout all devices"
  // This can be enabled in a future release by creating sessions on login and validating them here

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Admin impersonation indicator bar */}
      {impersonatingUser && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white text-center py-1.5 px-4 flex items-center justify-center gap-3">
          <span className="text-sm font-medium">
            Logged in as: <span className="font-bold">{impersonatingUser.name}</span>
          </span>
          <button
            onClick={exitImpersonation}
            className="px-3 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
          >
            Exit
          </button>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Always collapsed on desktop with hover tooltips */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`fixed top-0 left-0 z-50 h-full bg-black border-r border-white/10 transform transition-[width] duration-100 ease-out lg:translate-x-0 w-64 ${
          sidebarHovered ? "lg:w-52" : "lg:w-[72px]"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo - aligned with header height */}
          <div className="py-3 lg:h-[73px] flex items-center transition-all duration-200 px-6 lg:px-2 justify-center">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src={branding.logoUrl || "/velocity.jpg"}
                alt={branding.companyName || "Velocity"}
                width={48}
                height={48}
                className="h-[48px] w-[48px] object-contain rounded-lg"
                unoptimized={branding.logoUrl ? true : false}
              />
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden transition-all duration-200 p-4 lg:px-1 lg:py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center py-3 rounded-xl transition-all duration-200 gap-3 px-4 lg:px-2 ${
                    isActive
                      ? "text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                  style={isActive ? { backgroundColor: "rgba(255,255,255,0.15)" } : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                  <span className="font-medium whitespace-nowrap overflow-hidden">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto lg:hidden" />}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section: Admin + Settings + User */}
          <div className="border-t border-white/10 transition-all duration-200 p-4 lg:px-1 lg:py-2 overflow-hidden space-y-1">
            {/* Admin Section - above Settings */}
            {profile?.is_admin && (
              <>
                <div className="pb-2 px-4 lg:px-2 overflow-hidden">
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
                    <Shield className="w-3 h-3 flex-shrink-0" />
                    <span className="overflow-hidden">Admin</span>
                  </p>
                </div>
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group relative flex items-center py-3 rounded-xl transition-all duration-200 gap-3 px-4 lg:px-2 ${
                        isActive
                          ? "text-white"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                      style={isActive ? { backgroundColor: "rgba(255,255,255,0.15)" } : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                      <span className="font-medium whitespace-nowrap overflow-hidden">{item.name}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto lg:hidden" />}
                    </Link>
                  )
                })}
                <div className="my-2 border-t border-white/10" />
              </>
            )}

            {/* Settings - always at bottom */}
            {(() => {
              const isActive = pathname === settingsItem.href || pathname.startsWith(settingsItem.href)
              return (
                <Link
                  href={settingsItem.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center py-3 rounded-xl transition-all duration-200 gap-3 px-4 lg:px-2 ${
                    isActive
                      ? "text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                  style={isActive ? { backgroundColor: "rgba(255,255,255,0.15)" } : undefined}
                >
                  <settingsItem.icon className="w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                  <span className="font-medium whitespace-nowrap overflow-hidden">{settingsItem.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto lg:hidden" />}
                </Link>
              )
            })()}
            {/* User info */}
            <div className="flex items-center py-3 mb-2 gap-3 px-4 lg:px-2 overflow-hidden">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10"
              >
                <span className="font-semibold text-white">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium truncate whitespace-nowrap">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-white/40 truncate whitespace-nowrap">
                  {profile?.company_name || user?.email}
                </p>
              </div>
            </div>
            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="group flex items-center py-3 w-full rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 gap-3 px-4 lg:px-2 overflow-hidden"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
              <span className="font-medium whitespace-nowrap overflow-hidden">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`lg:pl-[72px] ${pathname.startsWith("/dashboard/admin/crm") ? "" : "pb-16"} lg:pb-0 transition-all duration-200`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 lg:h-[73px]">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 h-full">
            {/* Mobile: hamburger + title */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-semibold text-lg">{getPageTitle()}</h1>
            </div>
            {/* Desktop: page title */}
            <h1 className="hidden lg:block text-xl font-bold">
              {getPageTitle() === "AI Assistant" ? (
                <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  AI Assistant
                </span>
              ) : (
                getPageTitle()
              )}
            </h1>
            <div className="flex-1" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <DashboardCacheProvider>
            {children}
          </DashboardCacheProvider>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Hidden on CRM pages (they have their own nav) */}
      {!pathname.startsWith("/dashboard/admin/crm") && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 lg:hidden">
          <div className="flex items-center justify-around px-2 py-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                    isActive
                      ? ""
                      : "text-white/50 active:text-white"
                  }`}
                  style={isActive ? { color: "white", textShadow: "0 0 10px rgba(255,255,255,0.5)" } : undefined}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
