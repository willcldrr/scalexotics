"use client"

import { useState } from "react"
import { Settings, User, Monitor, MessageCircle, CreditCard, Instagram } from "lucide-react"

// Import tab content
import AccountSettings from "./account-settings"
import SessionsSettings from "./sessions-settings"
import TelegramSettings from "./telegram-settings"
import InstagramSettings from "./instagram-settings"
import DepositPortalSettings from "./deposit-portal-settings"

type TabKey = "account" | "sessions" | "telegram" | "instagram" | "deposit"

const tabs: { key: TabKey; label: string; icon: React.ElementType; group: string; comingSoon?: boolean }[] = [
  { key: "account", label: "Account", icon: User, group: "General" },
  { key: "sessions", label: "Sessions", icon: Monitor, group: "General" },
  { key: "telegram", label: "Telegram Bot", icon: MessageCircle, group: "Connections", comingSoon: true },
  { key: "instagram", label: "Instagram DMs", icon: Instagram, group: "Connections" },
  { key: "deposit", label: "Deposit Portal", icon: CreditCard, group: "Billing" },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("account")

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
          <Settings className="w-5 h-5 text-white/80" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-white/50 hidden sm:block">Manage your account, connections, and preferences</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 sm:gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto scrollbar-none -mx-1 px-1">
        {tabs.map(({ key, label, icon: Icon, comingSoon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              comingSoon
                ? "opacity-50 cursor-not-allowed text-white/30"
                : activeTab === key
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                  : "text-white/50 hover:text-white hover:bg-white/[0.06]"
            }`}
            disabled={comingSoon}
          >
            <Icon className="w-4 h-4" />
            {label}
            {comingSoon && <span className="px-2 py-0.5 bg-white/[0.06] text-white/30 text-[10px] rounded-full font-medium uppercase tracking-wider">Coming Soon</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "account" && <AccountSettings />}
        {activeTab === "sessions" && <SessionsSettings />}
        {activeTab === "telegram" && (
          <div className="relative">
            <div className="opacity-50 pointer-events-none select-none">
              <TelegramSettings />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl px-8 py-6 text-center">
                <span className="px-3 py-1 bg-white/[0.06] text-white/30 text-xs rounded-full font-medium uppercase tracking-wider">Coming Soon</span>
                <p className="text-white/40 text-sm mt-3">Telegram integration is in development</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === "instagram" && <InstagramSettings />}
        {activeTab === "deposit" && <DepositPortalSettings />}
      </div>
    </div>
  )
}
