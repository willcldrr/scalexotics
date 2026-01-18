"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardCacheProvider } from "@/lib/dashboard-cache"
import { getSidebarSettings, getDefaultSidebarSettings, SidebarSettings } from "./settings/sidebar-settings"
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
  BarChart3,
  MessageSquare,
  UserCircle,
  Receipt,
  ClipboardCheck,
  Truck,
  Globe,
  Shield,
  FileText,
  Key,
} from "lucide-react"

// Ordered by frequency of use for rental fleet owners
const allNavItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, key: "overview", alwaysVisible: true },
  { name: "Leads", href: "/dashboard/leads", icon: Users, key: "leads" },
  { name: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck, key: "bookings" },
  { name: "Customers", href: "/dashboard/customers", icon: UserCircle, key: "customers" },
  { name: "Vehicles", href: "/dashboard/vehicles", icon: Car, key: "vehicles" },
  { name: "Inspections", href: "/dashboard/inspections", icon: ClipboardCheck, key: "inspections" },
  { name: "Deliveries", href: "/dashboard/deliveries", icon: Truck, key: "deliveries" },
  { name: "Billing", href: "/dashboard/billing", icon: Receipt, key: "billing" },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, key: "analytics" },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot, key: "ai-assistant" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, key: "settings", alwaysVisible: true },
]

const adminNavItems = [
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0a0a0a] border-r border-white/10 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="https://imagedelivery.net/CVEJyzst_6io-ETn1V_PSw/3bdba65e-fb1a-4a3e-ff6f-1aa89b081f00/public"
                alt="Scale Exotics"
                width={28}
                height={28}
                className="h-7 w-auto"
              />
              <span className="font-semibold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                Dashboard
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[#375DEE] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              )
            })}

            {/* Admin Section */}
            {profile?.is_admin && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Admin
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? "bg-[#375DEE] text-white"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
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
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/40 hidden sm:block">
                {profile?.company_name}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <DashboardCacheProvider>
            {children}
          </DashboardCacheProvider>
        </main>
      </div>
    </div>
  )
}
