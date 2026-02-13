"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardCacheProvider } from "@/lib/dashboard-cache"
import { getSidebarSettings, getDefaultSidebarSettings, SidebarSettings } from "./settings/sidebar-settings"

const SESSION_TOKEN_KEY = 'scale_exotics_session_token'
import {
  LayoutDashboard,
  Users,
  Car,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bot,
  MessageSquare,
  UserCircle,
  Receipt,
  Globe,
  Shield,
  FileText,
  Key,
  RefreshCw,
  Building2,
  Home,
} from "lucide-react"

// Ordered by frequency of use for rental fleet owners
const allNavItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, key: "overview", alwaysVisible: true },
  { name: "Leads", href: "/dashboard/leads", icon: Users, key: "leads" },
  { name: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck, key: "bookings" },
  { name: "Customers", href: "/dashboard/customers", icon: UserCircle, key: "customers" },
  { name: "Vehicles", href: "/dashboard/vehicles", icon: Car, key: "vehicles" },
  { name: "Billing", href: "/dashboard/billing", icon: Receipt, key: "billing" },
  { name: "Reactivation", href: "/dashboard/reactivation", icon: RefreshCw, key: "reactivation" },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot, key: "ai-assistant" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, key: "settings", alwaysVisible: true },
]

const adminNavItems = [
  { name: "CRM", href: "/dashboard/admin/crm", icon: Building2, key: "admin-crm" },
  { name: "Domains", href: "/dashboard/admin/domains", icon: Globe, key: "admin-domains" },
  { name: "Invoices", href: "/dashboard/admin/invoices", icon: FileText, key: "admin-invoices" },
  { name: "Access Codes", href: "/dashboard/admin/access-codes", icon: Key, key: "admin-access-codes" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sidebarSettings, setSidebarSettings] = useState<SidebarSettings>(getDefaultSidebarSettings())

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
    { name: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
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
      "/dashboard/bookings",
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

  // Session validation - TEMPORARILY DISABLED for debugging
  // TODO: Re-enable once session creation is fixed
  // useEffect(() => {
  //   let isSigningOut = false
  //   const validateSession = async () => {
  //     if (isSigningOut) return
  //     const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY)
  //     if (!sessionToken) return
  //     try {
  //       const response = await fetch('/api/sessions/validate', {
  //         headers: { 'x-session-token': sessionToken }
  //       })
  //       if (response.status === 401) {
  //         const data = await response.json()
  //         if (data.revoked) {
  //           isSigningOut = true
  //           localStorage.removeItem(SESSION_TOKEN_KEY)
  //           await supabase.auth.signOut()
  //           router.push("/login")
  //           router.refresh()
  //         }
  //       }
  //     } catch {}
  //   }
  //   const initialTimeout = setTimeout(validateSession, 2000)
  //   const interval = setInterval(validateSession, 30000)
  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === 'visible') validateSession()
  //   }
  //   document.addEventListener('visibilitychange', handleVisibilityChange)
  //   return () => {
  //     clearTimeout(initialTimeout)
  //     clearInterval(interval)
  //     document.removeEventListener('visibilitychange', handleVisibilityChange)
  //   }
  // }, [supabase, router])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: Icon only with tooltips, Mobile: Full width */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-black border-r border-white/10 transform transition-transform duration-200 lg:translate-x-0 w-64 lg:w-[72px] lg:overflow-visible ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full lg:overflow-visible">
          {/* Logo - aligned with header height */}
          <div className="px-6 lg:px-3 py-3 lg:py-[14px] border-b border-white/10 flex justify-center items-center">
            <Link href="/dashboard" className="flex items-center gap-3 lg:gap-0">
              <Image
                src="/scalexoticslogo.png"
                alt="Scale Exotics"
                width={60}
                height={60}
                className="h-[60px] w-[60px] lg:h-[44px] lg:w-[44px] object-contain"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 lg:p-2 space-y-1 overflow-y-auto lg:overflow-visible">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center gap-3 px-4 lg:px-0 lg:justify-center py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[#375DEE] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium lg:hidden">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto lg:hidden" />}
                  {/* Tooltip for desktop */}
                  <span className="absolute left-full ml-3 px-3 py-2 bg-black text-white text-sm font-medium rounded-lg whitespace-nowrap scale-0 lg:group-hover:scale-100 opacity-0 lg:group-hover:opacity-100 transition-all duration-150 pointer-events-none z-[100] shadow-lg border border-white/10 origin-left">
                    {item.name}
                  </span>
                </Link>
              )
            })}

            {/* Admin Section */}
            {profile?.is_admin && (
              <>
                <div className="pt-4 pb-2 px-4 lg:px-2 lg:flex lg:justify-center">
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
                      className={`group relative flex items-center gap-3 px-4 lg:px-0 lg:justify-center py-3 rounded-xl transition-colors ${
                        isActive
                          ? "bg-[#375DEE] text-white"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium lg:hidden">{item.name}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto lg:hidden" />}
                      {/* Tooltip for desktop */}
                      <span className="absolute left-full ml-3 px-3 py-2 bg-black text-white text-sm font-medium rounded-lg whitespace-nowrap scale-0 lg:group-hover:scale-100 opacity-0 lg:group-hover:opacity-100 transition-all duration-150 pointer-events-none z-[100] shadow-lg border border-white/10 origin-left">
                        {item.name}
                      </span>
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* User section */}
          <div className="p-4 lg:p-2 border-t border-white/10 lg:overflow-visible">
            {/* Mobile: Full user info */}
            <div className="flex items-center gap-3 px-4 py-3 mb-2 lg:hidden">
              <div className="w-10 h-10 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
                <span className="text-[#375DEE] font-semibold">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {profile?.company_name || user?.email}
                </p>
              </div>
            </div>
            {/* Desktop: Avatar only with tooltip */}
            <div className="hidden lg:flex justify-center mb-2">
              <div className="group relative w-10 h-10 rounded-full bg-[#375DEE]/20 flex items-center justify-center cursor-default">
                <span className="text-[#375DEE] font-semibold">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-3 py-2 bg-black text-white text-sm font-medium rounded-lg whitespace-nowrap scale-0 lg:group-hover:scale-100 opacity-0 lg:group-hover:opacity-100 transition-all duration-150 pointer-events-none z-[100] shadow-lg border border-white/10 origin-left">
                  {profile?.full_name || "User"}
                </span>
              </div>
            </div>
            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="group relative flex items-center gap-3 px-4 lg:px-0 lg:justify-center py-3 w-full rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium lg:hidden">Sign Out</span>
              {/* Tooltip for desktop */}
              <span className="absolute left-full ml-3 px-3 py-2 bg-black text-white text-sm font-medium rounded-lg whitespace-nowrap scale-0 lg:group-hover:scale-100 opacity-0 lg:group-hover:opacity-100 transition-all duration-150 pointer-events-none z-[100] shadow-lg border border-white/10 origin-left">
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`lg:pl-[72px] ${pathname.startsWith("/dashboard/admin/crm") ? "" : "pb-16"} lg:pb-0`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-semibold text-lg">{getPageTitle()}</h1>
            </div>
            <div className="flex-1 hidden lg:block" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/40 hidden sm:block">
                {profile?.company_name}
              </span>
            </div>
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
                      ? "text-[#375DEE]"
                      : "text-white/50 active:text-white"
                  }`}
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
