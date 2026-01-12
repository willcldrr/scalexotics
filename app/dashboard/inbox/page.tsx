"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  User,
  Clock,
  ChevronLeft,
  Loader2,
  Bot,
  UserCircle,
  Filter,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  status: string
  created_at: string
  last_message?: string
  last_message_time?: string
  unread_count?: number
}

interface Message {
  id: string
  content: string
  direction: "inbound" | "outbound"
  created_at: string
}

export default function InboxPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchLeadsWithMessages()
  }, [])

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id)
    }
  }, [selectedLead])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchLeadsWithMessages = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get all leads with their latest message
      const { data: leadsData } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (leadsData) {
        // Fetch latest message for each lead
        const leadsWithMessages = await Promise.all(
          leadsData.map(async (lead) => {
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("content, created_at, direction")
              .eq("lead_id", lead.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            return {
              ...lead,
              last_message: lastMsg?.content,
              last_message_time: lastMsg?.created_at,
            }
          })
        )

        // Sort by last message time
        leadsWithMessages.sort((a, b) => {
          const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0
          const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0
          return timeB - timeA
        })

        setLeads(leadsWithMessages)
      }
    }

    setLoading(false)
  }

  const fetchMessages = async (leadId: string) => {
    setMessagesLoading(true)
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })

    setMessages(data || [])
    setMessagesLoading(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || sending) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Save message to database
      const { data: savedMessage, error: saveError } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          lead_id: selectedLead.id,
          content: newMessage,
          direction: "outbound",
        })
        .select()
        .single()

      if (saveError) throw saveError

      // Send via Twilio
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedLead.phone,
          message: newMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send SMS")
      }

      // Add to local state
      if (savedMessage) {
        setMessages([...messages, savedMessage])
      }

      setNewMessage("")

      // Update lead's last message
      setLeads(leads.map(l =>
        l.id === selectedLead.id
          ? { ...l, last_message: newMessage, last_message_time: new Date().toISOString() }
          : l
      ))

    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    }

    setSending(false)
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500",
      contacted: "bg-purple-500",
      qualified: "bg-yellow-500",
      negotiating: "bg-orange-500",
      converted: "bg-green-500",
      lost: "bg-red-500",
    }
    return colors[status] || "bg-gray-500"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Inbox
          </h1>
          <p className="text-white/50 mt-1">Loading conversations...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Inbox
        </h1>
        <p className="text-white/50 mt-1">Manage all your SMS conversations</p>
      </div>

      {/* Main Content */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-96 border-r border-white/10 flex flex-col ${selectedLead ? "hidden md:flex" : "flex"}`}>
            {/* Search & Filter */}
            <div className="p-4 border-b border-white/10 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                />
              </div>
              <div className="flex gap-2">
                {["all", "new", "contacted", "converted"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      statusFilter === status
                        ? "bg-[#375DEE] text-white"
                        : "bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <MessageSquare className="w-12 h-12 mb-3" />
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`w-full p-4 border-b border-white/5 hover:bg-white/5 transition-colors text-left ${
                      selectedLead?.id === lead.id ? "bg-white/10" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#375DEE] font-semibold">
                          {lead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{lead.name}</span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(lead.status)}`} />
                        </div>
                        <p className="text-sm text-white/40 truncate">{lead.phone}</p>
                        {lead.last_message && (
                          <p className="text-sm text-white/50 truncate mt-1">{lead.last_message}</p>
                        )}
                        {lead.last_message_time && (
                          <p className="text-xs text-white/30 mt-1">
                            {formatDistanceToNow(new Date(lead.last_message_time), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className={`flex-1 flex flex-col ${selectedLead ? "flex" : "hidden md:flex"}`}>
            {selectedLead ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="md:hidden p-2 rounded-lg hover:bg-white/5"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-[#375DEE]/20 flex items-center justify-center">
                    <span className="text-[#375DEE] font-semibold">
                      {selectedLead.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedLead.name}</h3>
                    <p className="text-sm text-white/50">{selectedLead.phone}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLead.status)} bg-opacity-20`}>
                    {selectedLead.status}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-[#375DEE]" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/40">
                      <MessageSquare className="w-12 h-12 mb-3" />
                      <p>No messages yet</p>
                      <p className="text-sm">Send the first message below</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-end gap-2 max-w-[80%] ${message.direction === "outbound" ? "flex-row-reverse" : ""}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.direction === "outbound" ? "bg-[#375DEE]/20" : "bg-white/10"
                          }`}>
                            {message.direction === "outbound" ? (
                              <Bot className="w-3 h-3 text-[#375DEE]" />
                            ) : (
                              <UserCircle className="w-3 h-3 text-white/50" />
                            )}
                          </div>
                          <div>
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                message.direction === "outbound"
                                  ? "bg-[#375DEE] text-white rounded-br-md"
                                  : "bg-white/10 text-white rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className={`text-xs text-white/30 mt-1 ${message.direction === "outbound" ? "text-right" : ""}`}>
                              {format(new Date(message.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white rounded-xl transition-colors"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                <MessageSquare className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a lead from the list to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
