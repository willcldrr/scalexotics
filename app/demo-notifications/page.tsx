"use client"

import { useState, useEffect, useRef } from "react"
import {
  Play,
  RotateCcw,
  UserPlus,
  Calendar,
  MessageSquare,
  DollarSign,
  Car,
  Bell,
} from "lucide-react"

interface Notification {
  id: string
  type: "lead" | "booking" | "message" | "payment" | "inquiry"
  title: string
  description: string
  time: string
}

const notificationScript = [
  { type: "lead", title: "New Lead", description: "Marcus Johnson inquired about BMW M4", time: "Just now" },
  { type: "booking", title: "Booking Confirmed", description: "Lamborghini Huracán - Dec 28-30", time: "Just now" },
  { type: "message", title: "New Message", description: "Sarah: 'Is the Ferrari available?'", time: "Just now" },
  { type: "payment", title: "Payment Received", description: "$2,250 for BMW M4 rental", time: "Just now" },
  { type: "lead", title: "New Lead", description: "David Chen interested in Porsche 911", time: "Just now" },
  { type: "inquiry", title: "Vehicle Inquiry", description: "McLaren 720S - Weekend rental", time: "Just now" },
  { type: "booking", title: "Booking Confirmed", description: "Rolls Royce Cullinan - Jan 5-7", time: "Just now" },
  { type: "lead", title: "New Lead", description: "Emily Rodriguez - Ferrari 488 GTB", time: "Just now" },
  { type: "payment", title: "Payment Received", description: "$4,500 for Lamborghini rental", time: "Just now" },
  { type: "message", title: "New Message", description: "Mike: 'Can I extend my booking?'", time: "Just now" },
  { type: "lead", title: "New Lead", description: "James Wilson inquired about Bentley", time: "Just now" },
  { type: "booking", title: "Booking Confirmed", description: "Mercedes AMG GT - Jan 10-12", time: "Just now" },
  { type: "lead", title: "New Lead", description: "Ashley Kim - Range Rover Sport", time: "Just now" },
  { type: "payment", title: "Payment Received", description: "$1,800 for Porsche rental", time: "Just now" },
  { type: "inquiry", title: "Vehicle Inquiry", description: "Ferrari SF90 - Valentine's Day", time: "Just now" },
  { type: "lead", title: "New Lead", description: "Chris Brown interested in McLaren", time: "Just now" },
  { type: "booking", title: "Booking Confirmed", description: "BMW M4 - Jan 15-17", time: "Just now" },
  { type: "message", title: "New Message", description: "Lisa: 'What's the mileage limit?'", time: "Just now" },
  { type: "payment", title: "Payment Received", description: "$3,750 for Ferrari rental", time: "Just now" },
  { type: "lead", title: "New Lead", description: "Robert Taylor - Lamborghini Urus", time: "Just now" },
  { type: "booking", title: "Booking Confirmed", description: "Porsche 911 Turbo - Jan 20-22", time: "Just now" },
  { type: "lead", title: "New Lead", description: "Jennifer Lee inquired about Rolls Royce", time: "Just now" },
  { type: "payment", title: "Payment Received", description: "$5,200 for Rolls Royce rental", time: "Just now" },
  { type: "inquiry", title: "Vehicle Inquiry", description: "Bentley Continental - Wedding", time: "Just now" },
  { type: "lead", title: "New Lead", description: "Kevin Martinez - Ferrari Portofino", time: "Just now" },
]

export default function DemoNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const notificationsEndRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    notificationsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [notifications])

  const playNotifications = async () => {
    if (isPlaying) return

    setIsPlaying(true)
    setNotifications([])
    setCurrentIndex(0)
    setIsComplete(false)

    playNextNotification(0)
  }

  const playNextNotification = (index: number) => {
    if (index >= notificationScript.length) {
      setIsPlaying(false)
      setIsComplete(true)
      return
    }

    const notif = notificationScript[index]

    const newNotification: Notification = {
      id: `notif-${index}`,
      type: notif.type as Notification["type"],
      title: notif.title,
      description: notif.description,
      time: notif.time,
    }

    setNotifications(prev => [...prev, newNotification])
    setCurrentIndex(index + 1)

    // Random delay between 700-1500ms
    const delay = 700 + Math.random() * 800
    timeoutRef.current = setTimeout(() => {
      playNextNotification(index + 1)
    }, delay)
  }

  const resetDemo = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setNotifications([])
    setIsPlaying(false)
    setCurrentIndex(0)
    setIsComplete(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case "lead":
        return <UserPlus className="w-5 h-5" />
      case "booking":
        return <Calendar className="w-5 h-5" />
      case "message":
        return <MessageSquare className="w-5 h-5" />
      case "payment":
        return <DollarSign className="w-5 h-5" />
      case "inquiry":
        return <Car className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case "lead":
        return "bg-[#375DEE]/20 text-[#375DEE]"
      case "booking":
        return "bg-green-500/20 text-green-400"
      case "message":
        return "bg-purple-500/20 text-purple-400"
      case "payment":
        return "bg-emerald-500/20 text-emerald-400"
      case "inquiry":
        return "bg-orange-500/20 text-orange-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex flex-col items-center justify-center p-6 relative" style={{ fontFamily: 'var(--font-sans)' }}>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes slideInFromRight {
          0% {
            opacity: 0;
            transform: translateX(100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .notification-slide-in {
          animation: slideInFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Controls - Top Right */}
      <div className="absolute top-6 right-6 flex gap-4">
        {!isPlaying && !isComplete && (
          <button
            onClick={playNotifications}
            className="flex items-center gap-2 px-6 py-3 bg-[#375DEE] hover:bg-[#375DEE] text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-[#375DEE]/25"
          >
            <Play className="w-5 h-5" />
            Play Demo
          </button>
        )}
        {(isComplete || notifications.length > 0) && (
          <button
            onClick={resetDemo}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        )}
      </div>

      {/* Notifications Panel */}
      <div className="w-[420px] max-h-[700px] bg-black/50 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#375DEE]" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Notifications</h2>
              <p className="text-sm text-white/50">Scale Exotics Dashboard</p>
            </div>
          </div>
          {notifications.length > 0 && (
            <div className="px-3 py-1 bg-[#375DEE] rounded-full text-sm font-medium">
              {notifications.length}
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-3 max-h-[580px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {notifications.length === 0 && !isPlaying ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40">
              <Bell className="w-12 h-12 mb-3" />
              <p>Press Play to see notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5 notification-slide-in"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{notif.title}</span>
                    <span className="text-xs text-white/40 flex-shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-sm text-white/60 truncate">{notif.description}</p>
                </div>
              </div>
            ))
          )}
          <div ref={notificationsEndRef} />
        </div>
      </div>

      {/* Stats Counter */}
      {(isPlaying || isComplete) && (
        <div className="mt-8 flex gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#375DEE]">
              {notifications.filter(n => n.type === "lead").length}
            </div>
            <div className="text-sm text-white/50">New Leads</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {notifications.filter(n => n.type === "booking").length}
            </div>
            <div className="text-sm text-white/50">Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">
              {notifications.filter(n => n.type === "payment").length}
            </div>
            <div className="text-sm text-white/50">Payments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {notifications.filter(n => n.type === "message").length}
            </div>
            <div className="text-sm text-white/50">Messages</div>
          </div>
        </div>
      )}

      {/* Glow effect */}
      <div className="absolute inset-0 bg-[#375DEE]/5 blur-3xl rounded-full -z-10 pointer-events-none" style={{ top: '20%', left: '30%', right: '30%', bottom: '20%' }} />
    </div>
  )
}
