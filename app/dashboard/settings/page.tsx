"use client"

import { useState } from "react"
import { User, Monitor, MessageCircle, CreditCard } from "lucide-react"

// Import tab content
import AccountSettings from "./account-settings"
import SessionsSettings from "./sessions-settings"
import TelegramSettings from "./telegram-settings"
import DepositPortalSettings from "./deposit-portal-settings"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"account" | "sessions" | "telegram" | "deposit">("account")

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.08] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "account"
              ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <User className="w-4 h-4" />
          Account
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "sessions"
              ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Monitor className="w-4 h-4" />
          Sessions
        </button>
        <button
          onClick={() => setActiveTab("telegram")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "telegram"
              ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Telegram Bot
        </button>
        <button
          onClick={() => setActiveTab("deposit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === "deposit"
              ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Deposit Portal
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "account" && <AccountSettings />}
      {activeTab === "sessions" && <SessionsSettings />}
      {activeTab === "telegram" && <TelegramSettings />}
      {activeTab === "deposit" && <DepositPortalSettings />}
    </div>
  )
}
