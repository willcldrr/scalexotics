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
} from "lucide-react"

// Ordered by frequency of use for rental fleet owners
const allNavItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, key: "overview", alwaysVisible: true },
  { name: "Leads", href: "/dashboard/leads", icon: Users, key: "leads" },
  { name: "Vehicles", href: "/dashboard/vehicles", icon: Car, key: "vehicles" },
  { name: "Bookings", href: "/dashboard/bookings", icon: CalendarDays, key: "bookings" },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot, key: "ai-assistant" },
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

  // Sidebar is always collapsed on desktop, expanded on mobile
  const isExpanded = false

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setProfile(profile)
      }
    }
    getUser()

    // Load sidebar settings
    setSidebarSettings(getSidebarSettings())

    // Listen for settings changes
    const handleSettingsChange = (e: CustomEvent<SidebarSettings>) => {
      setSidebarSettings(e.detail)
    }
    window.addEventListener("sidebarSettingsChanged", handleSettingsChange as EventListener)

    return () => {
      window.removeEventListener("sidebarSettingsChanged", handleSettingsChange as EventListener)
    }
  }, [])

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
        // Swipe right from left edge to open
        if (deltaX > 0 && touchStartX.current < 30 && !sidebarOpen) {
          setSidebarOpen(true)
          touchStartX.current = null
        }
        // Swipe left to close
        if (deltaX < 0 && sidebarOpen) {
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
  }, [sidebarOpen])

  // Bottom nav items for mobile (most important ones)
  const bottomNavItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Leads", href: "/dashboard/leads", icon: Users },
    { name: "Vehicles", href: "/dashboard/vehicles", icon: Car },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  const handleSignOut = useCallback(async () => {
    localStorage.removeItem(SESSION_TOKEN_KEY)
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }, [supabase, router])

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

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchRoutes)
    } else {
      // Fallback for Safari
      setTimeout(prefetchRoutes, 100)
    }
  }, [router])

  // Note: Device session management (user_sessions table) is available but not active
  // The sessions API exists at /api/sessions for tracking devices and allowing "logout all devices"
  // This can be enabled in a future release by creating sessions on login and validating them here

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Always collapsed on desktop with hover tooltips */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-black border-r border-white/10 transform transition-all duration-200 ease-out lg:translate-x-0 w-64 lg:w-[72px] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden lg:overflow-visible">
          {/* Logo - aligned with header height */}
          <div className="py-3 lg:h-[73px] flex items-center transition-all duration-200 px-6 lg:px-3 justify-center">
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
          <nav className="flex-1 space-y-1 overflow-y-auto lg:overflow-visible transition-all duration-200 p-4 lg:p-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center py-3 rounded-xl transition-colors gap-3 px-4 lg:gap-0 lg:px-0 lg:justify-center ${
                    isActive
                      ? "text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                  style={isActive ? { backgroundColor: "rgba(255,255,255,0.15)" } : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {/* Mobile: always show text */}
                  <span className="font-medium lg:hidden">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto lg:hidden" />}
                  {/* Desktop: tooltip on hover */}
                  <div className="hidden lg:flex absolute left-full ml-3 px-3 py-2 bg-[#1a1a1a] border border-white/20 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 whitespace-nowrap z-[100] shadow-xl items-center">
                    <span className="text-sm font-medium text-white">{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Bottom section: Admin + Settings + User */}
          <div className="border-t border-white/10 transition-all duration-200 p-4 lg:p-2 lg:overflow-visible space-y-1">
            {/* Admin Section - above Settings */}
            {profile?.is_admin && (
              <>
                <div className="pb-2 px-4 lg:px-2 lg:flex lg:justify-center">
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-wider flex items-center gap-2 lg:gap-0">
                    <Shield className="w-3 h-3" />
                    <span className="lg:hidden">Admin</span>
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
                      className={`group relative flex items-center py-3 rounded-xl transition-colors gap-3 px-4 lg:gap-0 lg:px-0 lg:justify-center ${
                        isActive
                          ? "text-white"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                      style={isActive ? { backgroundColor: "rgba(255,255,255,0.15)" } : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {/* Mobile: always show text */}
                      <span className="font-medium lg:hidden">{item.name}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto lg:hidden" />}
                      {/* Desktop: tooltip on hover */}
                      <div className="hidden lg:flex absolute left-full ml-3 px-3 py-2 bg-[#1a1a1a] border border-white/20 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 whitespace-nowrap z-[100] shadow-xl items-center">
                        <span className="text-sm font-medium text-white">{item.name}</span>
                      </div>
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
                  className={`group relative flex items-center py-3 rounded-xl transition-colors gap-3 px-4 lg:gap-0 lg:px-0 lg:justify-center ${
                    isActive
                      ? "text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                  style={isActive ? { backgroundColor: "rgba(255,255,255,0.15)" } : undefined}
                >
                  <settingsItem.icon className="w-5 h-5 flex-shrink-0" />
                  {/* Mobile: always show text */}
                  <span className="font-medium lg:hidden">{settingsItem.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto lg:hidden" />}
                  {/* Desktop: tooltip on hover */}
                  <div className="hidden lg:flex absolute left-full ml-3 px-3 py-2 bg-[#1a1a1a] border border-white/20 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 whitespace-nowrap z-[100] shadow-xl items-center">
                    <span className="text-sm font-medium text-white">{settingsItem.name}</span>
                  </div>
                </Link>
              )
            })()}
            {/* User info - shows on mobile always, tooltip on desktop */}
            <div className="group relative flex items-center py-3 mb-2 gap-3 px-4 lg:gap-0 lg:px-0 lg:justify-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10"
              >
                <span className="font-semibold text-white">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              {/* Mobile: always show info */}
              <div className="flex-1 min-w-0 lg:hidden">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {profile?.company_name || user?.email}
                </p>
              </div>
              {/* Desktop: tooltip on hover */}
              <div className="hidden lg:block absolute left-full ml-3 px-3 py-2 bg-[#1a1a1a] border border-white/20 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 whitespace-nowrap z-[100] shadow-xl">
                <p className="text-sm font-medium text-white">{profile?.full_name || "User"}</p>
                <p className="text-xs text-white/50">{profile?.company_name || user?.email}</p>
              </div>
            </div>
            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="group relative flex items-center py-3 w-full rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors gap-3 px-4 lg:gap-0 lg:px-0 lg:justify-center"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium lg:hidden">Sign Out</span>
              {/* Desktop: tooltip on hover */}
              <div className="hidden lg:flex absolute left-full ml-3 px-3 py-2 bg-[#1a1a1a] border border-white/20 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 whitespace-nowrap z-[100] shadow-xl items-center">
                <span className="text-sm font-medium text-white">Sign Out</span>
              </div>
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
