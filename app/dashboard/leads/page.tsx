"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Phone,
  Mail,
  X,
  MessageSquare,
  Send,
  ChevronLeft,
  Pencil,
  Trash2,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Check,
  CheckCheck,
  Loader2,
  Calendar,
  Car,
  StickyNote,
  ChevronDown,
  LayoutList,
  AlertTriangle,
  GripVertical,
  Clock,
  Instagram,
  MessageCircle,
  CreditCard,
  DollarSign,
  Link,
  ExternalLink,
  HelpCircle,
} from "lucide-react"
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns"
import { leadStatusOptions, getStatusColor, getStatusLabel, defaultLeadStatus } from "@/lib/lead-status"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import MatrixRainLoader from "@/app/components/matrix-rain-loader"

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string
  status: string
  source: string | null
  notes: string | null
  vehicle_interest: string | null
  created_at: string
  last_message?: string
  last_message_time?: string
  last_message_direction?: "inbound" | "outbound"
  unread: boolean
}

interface Message {
  id: string
  lead_id: string
  content: string
  direction: "inbound" | "outbound"
  created_at: string
}

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  daily_rate: number
}

const sourceOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "lead_capture", label: "Lead Capture" },
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Phone" },
  { value: "other", label: "Other" },
]

// Pipeline column configuration with progressive glow (dark → light → green/red)
const pipelineColumns = [
  { id: "new", label: "New", color: "bg-white/5 text-white/50 border-white/10", glow: "", textGlow: "" },
  { id: "contacted", label: "Contacted", color: "bg-white/10 text-white/60 border-white/20", glow: "", textGlow: "" },
  { id: "qualified", label: "Qualified", color: "bg-white/15 text-white/70 border-white/25", glow: "shadow-[0_0_8px_rgba(255,255,255,0.06)]", textGlow: "" },
  { id: "negotiating", label: "Negotiating", color: "bg-white/25 text-white/90 border-white/30", glow: "shadow-[0_0_10px_rgba(255,255,255,0.1)]", textGlow: "" },
  { id: "booked", label: "Booked", color: "bg-emerald-400 text-white border-emerald-300", glow: "shadow-[0_0_12px_rgba(52,211,153,0.4)]", textGlow: "" },
  { id: "lost", label: "Lost", color: "bg-red-400 text-white border-red-300", glow: "shadow-[0_0_12px_rgba(248,113,113,0.4)]", textGlow: "" },
]

export default function LeadsPage() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [readConversations, setReadConversations] = useState<Set<string>>(new Set())
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline")
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: defaultLeadStatus as string,
    source: "website",
    notes: "",
    vehicle_interest: "",
  })

  // CSV Import state
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Do Not Rent list for flagging suspicious leads
  const [doNotRentList, setDoNotRentList] = useState<{ full_name: string; phone?: string; email?: string }[]>([])

  // Payment link modal state
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false)
  const [paymentLinkLead, setPaymentLinkLead] = useState<Lead | null>(null)
  const [paymentLinkData, setPaymentLinkData] = useState({
    vehicleId: "",
    startDate: "",
    endDate: "",
    depositAmount: 0,
    totalAmount: 0,
  })
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false)
  const [paymentLinkSent, setPaymentLinkSent] = useState(false)
  const [paymentLinkError, setPaymentLinkError] = useState<string | null>(null)

  // Check if a lead is on the do not rent list
  const isOnDoNotRentList = (lead: Lead): boolean => {
    const leadNameLower = lead.name.toLowerCase().trim()
    const leadPhone = lead.phone?.replace(/\D/g, "")
    const leadEmail = lead.email?.toLowerCase().trim()

    return doNotRentList.some(entry => {
      const entryNameLower = entry.full_name.toLowerCase().trim()
      const entryPhone = entry.phone?.replace(/\D/g, "")
      const entryEmail = entry.email?.toLowerCase().trim()

      const nameMatch = leadNameLower === entryNameLower ||
        leadNameLower.includes(entryNameLower) ||
        entryNameLower.includes(leadNameLower)

      const phoneMatch = leadPhone && entryPhone && leadPhone === entryPhone
      const emailMatch = leadEmail && entryEmail && leadEmail === entryEmail

      return nameMatch || phoneMatch || emailMatch
    })
  }

  useEffect(() => {
    fetchData()
    const stored = localStorage.getItem("readConversations")
    if (stored) {
      setReadConversations(new Set(JSON.parse(stored)))
    }

    // Set up real-time subscription for leads
    const channel = supabase
      .channel("leads-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const newLead = payload.new as Lead
          setLeads((current) => [{ ...newLead, unread: true }, ...current])
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((current) =>
            current.map((lead) =>
              lead.id === payload.new.id ? { ...lead, ...payload.new } : lead
            )
          )
          setSelectedLead((current) =>
            current?.id === payload.new.id ? { ...current, ...payload.new } as Lead : current
          )
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((current) => current.filter((lead) => lead.id !== payload.old.id))
          setSelectedLead((current) =>
            current?.id === payload.old.id ? null : current
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id)
      markAsRead(selectedLead.id)
    }
  }, [selectedLead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAsRead = (leadId: string) => {
    setReadConversations(prev => {
      const newSet = new Set(prev)
      newSet.add(leadId)
      localStorage.setItem("readConversations", JSON.stringify([...newSet]))
      return newSet
    })
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, unread: false } : l
    ))
  }

  const fetchData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    setUserId(user.id)

    const [leadsRes, vehiclesRes, doNotRentRes] = await Promise.all([
      supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("vehicles").select("id, name, make, model, year, daily_rate").eq("user_id", user.id),
      supabase.from("do_not_rent_list").select("full_name, phone, email").eq("user_id", user.id),
    ])

    if (doNotRentRes.data) {
      setDoNotRentList(doNotRentRes.data)
    }

    if (leadsRes.data) {
      const storedRead = localStorage.getItem("readConversations")
      const readSet = storedRead ? new Set(JSON.parse(storedRead)) : new Set()

      const leadIds = leadsRes.data.map(lead => lead.id)

      const { data: allMessages } = await supabase
        .from("messages")
        .select("lead_id, content, created_at, direction")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false })

      const lastMessageMap = new Map<string, { content: string; created_at: string; direction: string }>()
      if (allMessages) {
        for (const msg of allMessages) {
          if (!lastMessageMap.has(msg.lead_id)) {
            lastMessageMap.set(msg.lead_id, {
              content: msg.content,
              created_at: msg.created_at,
              direction: msg.direction,
            })
          }
        }
      }

      const leadsWithMessages = leadsRes.data.map(lead => {
        const lastMsg = lastMessageMap.get(lead.id)
        const isUnread = lastMsg?.direction === "inbound" && !readSet.has(lead.id)

        return {
          ...lead,
          last_message: lastMsg?.content,
          last_message_time: lastMsg?.created_at,
          last_message_direction: lastMsg?.direction as "inbound" | "outbound" | undefined,
          unread: isUnread,
        }
      })

      leadsWithMessages.sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : new Date(a.created_at).getTime()
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : new Date(b.created_at).getTime()
        return timeB - timeA
      })

      setLeads(leadsWithMessages)
    }

    setVehicles(vehiclesRes.data || [])
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

      if (savedMessage) {
        setMessages([...messages, savedMessage])
      }

      setNewMessage("")

      setLeads(leads.map(l =>
        l.id === selectedLead.id
          ? { ...l, last_message: newMessage, last_message_time: new Date().toISOString(), last_message_direction: "outbound" }
          : l
      ))

    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message", { description: "Please check your connection and try again" })
    }

    setSending(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    const leadData = {
      user_id: userId,
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      status: formData.status,
      source: formData.source,
      notes: formData.notes || null,
      vehicle_interest: formData.vehicle_interest || null,
    }

    if (editingLead) {
      await supabase.from("leads").update(leadData).eq("id", editingLead.id)
    } else {
      await supabase.from("leads").insert(leadData)
    }

    setSaving(false)
    setShowAddModal(false)
    setEditingLead(null)
    resetForm()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return
    await supabase.from("leads").delete().eq("id", id)
    if (selectedLead?.id === id) {
      setSelectedLead(null)
    }
    fetchData()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from("leads").update({ status: newStatus }).eq("id", id)
    setLeads(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l)))
    if (selectedLead?.id === id) {
      setSelectedLead({ ...selectedLead, status: newStatus })
    }
    setShowStatusDropdown(false)
  }

  // Payment link functions
  const openPaymentLinkModal = (lead: Lead) => {
    setPaymentLinkLead(lead)
    // Pre-fill with vehicle interest if available
    const defaultVehicle = lead.vehicle_interest ? vehicles.find(v => v.id === lead.vehicle_interest) : vehicles[0]
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const startDate = today.toISOString().split('T')[0]
    const endDate = tomorrow.toISOString().split('T')[0]
    const dailyRate = defaultVehicle?.daily_rate || 0
    const totalAmount = dailyRate
    const depositAmount = Math.round(totalAmount * 0.25)

    setPaymentLinkData({
      vehicleId: defaultVehicle?.id || "",
      startDate,
      endDate,
      depositAmount,
      totalAmount,
    })
    setPaymentLinkSent(false)
    setPaymentLinkError(null)
    setShowPaymentLinkModal(true)
  }

  const calculatePaymentAmounts = (vehicleId: string, startDate: string, endDate: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (!vehicle || !startDate || !endDate) return { totalAmount: 0, depositAmount: 0 }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const totalAmount = vehicle.daily_rate * days
    const depositAmount = Math.round(totalAmount * 0.25)

    return { totalAmount, depositAmount, days }
  }

  const updatePaymentLinkField = (field: string, value: string) => {
    const newData = { ...paymentLinkData, [field]: value }

    // Recalculate amounts when vehicle or dates change
    if (field === 'vehicleId' || field === 'startDate' || field === 'endDate') {
      const { totalAmount, depositAmount } = calculatePaymentAmounts(
        field === 'vehicleId' ? value : newData.vehicleId,
        field === 'startDate' ? value : newData.startDate,
        field === 'endDate' ? value : newData.endDate
      )
      newData.totalAmount = totalAmount
      newData.depositAmount = depositAmount
    }

    setPaymentLinkData(newData)
  }

  const sendPaymentLink = async () => {
    if (!paymentLinkLead || !paymentLinkData.vehicleId || !paymentLinkData.startDate || !paymentLinkData.endDate) {
      setPaymentLinkError("Please fill in all required fields")
      return
    }

    setSendingPaymentLink(true)
    setPaymentLinkError(null)

    try {
      const vehicle = vehicles.find(v => v.id === paymentLinkData.vehicleId)
      if (!vehicle) throw new Error("Vehicle not found")

      // Generate payment link via API
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: paymentLinkLead.id,
          vehicleId: paymentLinkData.vehicleId,
          startDate: paymentLinkData.startDate,
          endDate: paymentLinkData.endDate,
          depositAmount: paymentLinkData.depositAmount,
          customerPhone: paymentLinkLead.phone,
          customerName: paymentLinkLead.name,
          customerEmail: paymentLinkLead.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment link")
      }

      // Send the payment link via SMS
      const paymentUrl = data.checkoutUrl
      const messageContent = `Hi ${paymentLinkLead.name}! Here's your secure payment link to reserve the ${vehicle.year} ${vehicle.make} ${vehicle.model} for ${paymentLinkData.startDate} to ${paymentLinkData.endDate}. Deposit: $${paymentLinkData.depositAmount}. Pay here: ${paymentUrl}`

      const smsResponse = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: paymentLinkLead.phone,
          message: messageContent,
          leadId: paymentLinkLead.id,
        }),
      })

      if (!smsResponse.ok) {
        // Even if SMS fails, the link was created - show it to copy
        console.warn("SMS send failed, but payment link created:", paymentUrl)
      }

      // Save the message to the database
      await supabase.from("messages").insert({
        lead_id: paymentLinkLead.id,
        user_id: userId,
        content: messageContent,
        direction: "outbound",
      })

      // Update lead status to negotiating
      await handleStatusChange(paymentLinkLead.id, "negotiating")

      setPaymentLinkSent(true)

      // Refresh messages if viewing this lead
      if (selectedLead?.id === paymentLinkLead.id) {
        fetchMessages(paymentLinkLead.id)
      }

    } catch (error: any) {
      console.error("Payment link error:", error)
      setPaymentLinkError(error.message || "Failed to send payment link")
    } finally {
      setSendingPaymentLink(false)
    }
  }

  // Drag and drop handlers for pipeline
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (draggedLead && draggedLead.status !== newStatus) {
      await handleStatusChange(draggedLead.id, newStatus)
    }
    setDraggedLead(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      status: defaultLeadStatus,
      source: "website",
      notes: "",
      vehicle_interest: "",
    })
  }

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone,
      status: lead.status,
      source: lead.source || "website",
      notes: lead.notes || "",
      vehicle_interest: lead.vehicle_interest || "",
    })
    setShowAddModal(true)
  }

  // CSV Import functions
  const parseCSV = (text: string): { headers: string[]; data: Array<Record<string, string>> } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length === 0) return { headers: [], data: [] }

    const headers = parseCSVLine(lines[0])
    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line)
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      return row
    }).filter(row => Object.values(row).some(v => v.trim()))

    return { headers, data }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { headers, data } = parseCSV(text)
      setCsvHeaders(headers)
      setCsvData(data)
      setImportResult(null)

      const autoMapping: Record<string, string> = {}
      const nameVariants = ["name", "full name", "fullname", "customer name", "contact name", "first name"]
      const emailVariants = ["email", "e-mail", "email address", "mail"]
      const phoneVariants = ["phone", "phone number", "telephone", "tel", "mobile", "cell"]
      const notesVariants = ["notes", "note", "comments", "comment", "description"]

      headers.forEach(header => {
        const lowerHeader = header.toLowerCase()
        if (nameVariants.some(v => lowerHeader.includes(v))) autoMapping[header] = "name"
        else if (emailVariants.some(v => lowerHeader.includes(v))) autoMapping[header] = "email"
        else if (phoneVariants.some(v => lowerHeader.includes(v))) autoMapping[header] = "phone"
        else if (notesVariants.some(v => lowerHeader.includes(v))) autoMapping[header] = "notes"
      })

      setColumnMapping(autoMapping)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!userId || csvData.length === 0) return
    setImporting(true)

    let success = 0
    let failed = 0

    const nameCol = Object.entries(columnMapping).find(([_, v]) => v === "name")?.[0]
    const emailCol = Object.entries(columnMapping).find(([_, v]) => v === "email")?.[0]
    const phoneCol = Object.entries(columnMapping).find(([_, v]) => v === "phone")?.[0]
    const notesCol = Object.entries(columnMapping).find(([_, v]) => v === "notes")?.[0]

    if (!nameCol || !phoneCol) {
      toast.error("Missing required columns", { description: "Please map at least Name and Phone columns" })
      setImporting(false)
      return
    }

    for (const row of csvData) {
      const name = row[nameCol]?.trim()
      const phone = row[phoneCol]?.trim()
      const email = emailCol ? row[emailCol]?.trim() : null
      const notes = notesCol ? row[notesCol]?.trim() : null

      if (!name || !phone) {
        failed++
        continue
      }

      const { error } = await supabase.from("leads").insert({
        user_id: userId,
        name,
        phone,
        email: email || null,
        notes: notes || null,
        status: defaultLeadStatus,
        source: "csv_import",
      })

      if (error) {
        failed++
      } else {
        success++
      }
    }

    setImportResult({ success, failed })
    setImporting(false)

    if (success > 0) {
      fetchData()
    }
  }

  const resetImportModal = () => {
    setCsvData([])
    setCsvHeaders([])
    setColumnMapping({})
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  // Get leads by status for pipeline view
  const getLeadsByStatus = (status: string) => {
    return filteredLeads.filter(lead => lead.status === status)
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "MMM d")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy")
  }

  const getVehicleName = (vehicleId: string | null) => {
    if (!vehicleId) return null
    const vehicle = vehicles.find(v => v.id === vehicleId)
    return vehicle ? `${vehicle.make} ${vehicle.model}` : null
  }

  const unreadCount = leads.filter(l => l.unread).length

  // Get channel info (icon, label, color) based on lead source
  const getChannelInfo = (source: string | null) => {
    switch (source) {
      case "instagram":
        return {
          icon: Instagram,
          label: "Instagram",
          color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
          textColor: "text-pink-400"
        }
      case "sms":
      case "phone":
        return {
          icon: MessageCircle,
          label: "SMS",
          color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
          textColor: "text-emerald-400"
        }
      case "facebook":
        return {
          icon: MessageSquare,
          label: "Facebook",
          color: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
          textColor: "text-blue-400"
        }
      default:
        return {
          icon: MessageSquare,
          label: source || "Unknown",
          color: "bg-white/10 text-white/60 border border-white/20",
          textColor: "text-white/60"
        }
    }
  }

  if (loading) {
    return <MatrixRainLoader />
  }

  return (
    <div>
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all shadow-[0_0_15px_rgba(255,255,255,0.03)]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* View toggle */}
          <div className="flex items-center bg-white/[0.04] rounded-xl border border-white/[0.08] p-1">
            <button
              onClick={() => setViewMode("pipeline")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === "pipeline"
                  ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              resetImportModal()
              setShowImportModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => {
              resetForm()
              setEditingLead(null)
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-semibold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {/* Pipeline View */}
      {viewMode === "pipeline" && (
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Mobile scroll hint */}
          <div className="sm:hidden text-xs text-white/30 text-center mb-2">← Scroll to see all columns →</div>
          <div className="flex gap-3 sm:gap-4 min-w-max">
            {pipelineColumns.map((column) => {
              const columnLeads = getLeadsByStatus(column.id)
              return (
                <div
                  key={column.id}
                  className={`w-56 sm:w-64 flex-shrink-0 rounded-2xl bg-white/[0.02] border transition-all ${
                    dragOverColumn === column.id
                      ? "border-white/30 bg-white/[0.05] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                      : "border-white/[0.06]"
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column Header */}
                  <div className="p-4 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${column.color} ${column.glow} ${column.textGlow}`}>
                          {column.label}
                        </span>
                        <span className="text-white/40 text-sm">{columnLeads.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="p-3 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {columnLeads.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-white/30 text-sm">No leads in this stage</p>
                        <p className="text-white/20 text-xs mt-1">Drag leads here or add new ones</p>
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onClick={() => setSelectedLead(lead)}
                          className={`p-4 rounded-xl bg-white/[0.03] border cursor-pointer group transition-all hover:bg-white/[0.06] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] ${
                            isOnDoNotRentList(lead)
                              ? "border-red-500/30 hover:border-red-500/50"
                              : lead.unread
                              ? "border-white/20"
                              : "border-white/[0.06] hover:border-white/20"
                          } ${draggedLead?.id === lead.id ? "opacity-50" : ""}`}
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${isOnDoNotRentList(lead) ? "text-red-400" : "text-white"}`}>
                                    {lead.name}
                                  </span>
                                  {isOnDoNotRentList(lead) && (
                                    <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded">
                                      DNR
                                    </span>
                                  )}
                                  {lead.unread && (
                                    <span className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-white/40">{lead.phone}</span>
                                  {/* Channel Badge */}
                                  {(() => {
                                    const channel = getChannelInfo(lead.source)
                                    const ChannelIcon = channel.icon
                                    return (
                                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${channel.color}`}>
                                        <ChannelIcon className="w-2.5 h-2.5" />
                                        {channel.label}
                                      </span>
                                    )
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Lead Info */}
                          <div className="space-y-2">
                            {/* Vehicle Interest */}
                            {getVehicleName(lead.vehicle_interest) && (
                              <div className="flex items-center gap-2 text-sm">
                                <Car className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-white/60">{getVehicleName(lead.vehicle_interest)}</span>
                              </div>
                            )}

                            {/* Notes (rental dates or other info from chatbot) */}
                            {lead.notes && (
                              <div className="flex items-start gap-2 text-sm">
                                <StickyNote className="w-3.5 h-3.5 text-white/40 mt-0.5" />
                                <span className="text-white/60 line-clamp-2">{lead.notes}</span>
                              </div>
                            )}

                            {/* Source */}
                            <div className="flex items-center gap-2 text-xs text-white/30">
                              <span className="capitalize">{lead.source || "Unknown"}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>

                          {/* Last Message Preview */}
                          {lead.last_message && (
                            <div className="mt-3 pt-3 border-t border-white/[0.06]">
                              <div className="flex items-center gap-1.5 text-xs">
                                {lead.last_message_direction === "outbound" && (
                                  <CheckCheck className="w-3 h-3 text-white/30" />
                                )}
                                <span className={`truncate ${lead.unread ? "text-white/70 font-medium" : "text-white/40"}`}>
                                  {lead.last_message}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_30px_rgba(255,255,255,0.03)] overflow-hidden h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)]">
          <div className="flex h-full">
            {/* Leads List */}
            <div className={`w-full md:w-[380px] border-r border-white/[0.08] flex flex-col bg-black/50 ${selectedLead ? "hidden md:flex" : "flex"}`}>
              <div className="flex-1 overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/50 font-medium">
                      {leads.length === 0 ? "No leads yet" : "No leads match your search"}
                    </p>
                    <p className="text-white/30 text-sm mt-1 max-w-[240px]">
                      {leads.length === 0
                        ? "Start building your customer pipeline by adding your first lead"
                        : "Try adjusting your search or filter criteria"}
                    </p>
                    {leads.length === 0 && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Lead
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {filteredLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`w-full p-4 hover:bg-white/[0.03] transition-all text-left group relative ${
                          selectedLead?.id === lead.id ? "bg-white/[0.05]" : ""
                        }`}
                      >
                        {lead.unread && (
                          <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        )}

                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isOnDoNotRentList(lead)
                                ? "bg-red-500/20 ring-2 ring-red-500/50"
                                : lead.unread
                                ? "bg-white/10 ring-2 ring-white/30"
                                : "bg-white/[0.06]"
                            }`}>
                              <span className={`font-semibold ${
                                isOnDoNotRentList(lead)
                                  ? "text-red-400"
                                  : lead.unread ? "text-white" : "text-white/60"
                              }`}>
                                {lead.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {isOnDoNotRentList(lead) ? (
                              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center">
                                <AlertTriangle className="w-2.5 h-2.5 text-white" />
                              </div>
                            ) : lead.unread && (
                              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full border-2 border-[#0a0a0a] shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className={`font-medium truncate flex items-center gap-1.5 ${
                                isOnDoNotRentList(lead)
                                  ? "text-red-400"
                                  : lead.unread ? "text-white" : "text-white/80"
                              }`}>
                                {lead.name}
                                {isOnDoNotRentList(lead) && (
                                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded uppercase">
                                    DNR
                                  </span>
                                )}
                              </span>
                              <span className={`text-xs flex-shrink-0 ${lead.unread ? "text-white font-medium" : "text-white/30"}`}>
                                {lead.last_message_time ? formatMessageTime(lead.last_message_time) : formatMessageTime(lead.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <p className="text-sm text-white/40 truncate">{lead.phone}</p>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(lead.status)}`}>
                                {getStatusLabel(lead.status)}
                              </span>
                            </div>
                            {lead.last_message && (
                              <div className="flex items-center gap-1.5">
                                {lead.last_message_direction === "outbound" && (
                                  <CheckCheck className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                )}
                                <p className={`text-sm truncate ${lead.unread ? "text-white/70 font-medium" : "text-white/40"}`}>
                                  {lead.last_message}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div className={`flex-1 flex flex-col bg-black/20 ${selectedLead ? "flex" : "hidden md:flex"}`}>
              {selectedLead ? (
                <>
                  {/* Lead Header */}
                  <div className="p-4 border-b border-white/[0.08] bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedLead(null)}
                        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-1 ${
                        isOnDoNotRentList(selectedLead)
                          ? "bg-gradient-to-br from-red-500/30 to-red-500/10 ring-red-500/30"
                          : "bg-gradient-to-br from-white/20 to-white/5 ring-white/10"
                      }`}>
                        <span className={`font-semibold ${isOnDoNotRentList(selectedLead) ? "text-red-400" : "text-white"}`}>
                          {selectedLead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold truncate ${isOnDoNotRentList(selectedLead) ? "text-red-400" : "text-white"}`}>
                            {selectedLead.name}
                          </h3>
                          {isOnDoNotRentList(selectedLead) && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">
                              <AlertTriangle className="w-3 h-3" />
                              DO NOT RENT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-white/40 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {selectedLead.phone}
                          </span>
                          {selectedLead.email && (
                            <span className="text-white/40 flex items-center gap-1.5 hidden sm:flex">
                              <Mail className="w-3.5 h-3.5" />
                              {selectedLead.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Dropdown */}
                        <div className="relative" ref={statusDropdownRef}>
                          <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${getStatusColor(selectedLead.status)}`}
                          >
                            {getStatusLabel(selectedLead.status)}
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          {showStatusDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden">
                              {leadStatusOptions.map((status) => (
                                <button
                                  key={status.value}
                                  onClick={() => handleStatusChange(selectedLead.id, status.value)}
                                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                                    selectedLead.status === status.value ? "bg-white/5" : ""
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${status.color.split(" ")[0].replace("/15", "")}`} />
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => openEditModal(selectedLead)}
                          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(selectedLead.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lead Details Panel */}
                  <div className="p-4 border-b border-white/[0.08] bg-black/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-white/40" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Source</p>
                          <p className="text-sm font-medium capitalize truncate">{selectedLead.source || "Unknown"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-white/40" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Added</p>
                          <p className="text-sm font-medium truncate">{formatDate(selectedLead.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                          <Car className="w-4 h-4 text-white/40" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Interest</p>
                          <p className="text-sm font-medium truncate">
                            {getVehicleName(selectedLead.vehicle_interest) || "Not specified"}
                          </p>
                        </div>
                      </div>
                      {selectedLead.notes && (
                        <div className="flex items-start gap-2.5 col-span-2 sm:col-span-1">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                            <StickyNote className="w-4 h-4 text-white/40" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-0.5">Notes</p>
                            <p className="text-sm font-medium truncate">{selectedLead.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                          <MessageSquare className="w-10 h-10 text-white/15" />
                        </div>
                        <p className="text-white/50 font-medium">No messages yet</p>
                        <p className="text-white/30 text-sm mt-1 max-w-[240px]">
                          Send a message to start the conversation with {selectedLead.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center mb-4">
                          <span className="px-3 py-1 bg-white/[0.04] rounded-full text-xs text-white/40">
                            {format(new Date(messages[0]?.created_at || new Date()), "MMMM d, yyyy")}
                          </span>
                        </div>

                        {messages.map((message, index) => {
                          const isOutbound = message.direction === "outbound"
                          const showTimestamp = index === messages.length - 1 ||
                            new Date(messages[index + 1]?.created_at).getTime() - new Date(message.created_at).getTime() > 300000

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`max-w-[75%] ${isOutbound ? "items-end" : "items-start"}`}>
                                <div
                                  className={`rounded-2xl px-4 py-2.5 ${
                                    isOutbound
                                      ? "bg-white text-black rounded-br-md"
                                      : "bg-white/[0.08] text-white rounded-bl-md"
                                  }`}
                                >
                                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                </div>
                                {showTimestamp && (
                                  <div className={`flex items-center gap-1.5 mt-1.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
                                    {isOutbound && <CheckCheck className="w-3.5 h-3.5 text-white/30" />}
                                    <p className="text-[11px] text-white/30">
                                      {format(new Date(message.created_at), "h:mm a")}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-white/[0.08] bg-white/[0.03]">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-5 py-3 bg-white hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white text-black rounded-xl transition-all flex items-center gap-2 font-medium shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <span className="hidden sm:inline">Send</span>
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6 ring-1 ring-white/[0.06] shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                    <MessageSquare className="w-12 h-12 text-white/30" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Select a lead</h3>
                  <p className="text-white/40 max-w-[280px]">
                    Choose a lead from the list to view details and manage their conversation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">
                {editingLead ? "Edit Lead" : "Add Lead"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors"
                  >
                    {leadStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors"
                  >
                    {sourceOptions.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Vehicle Interest</label>
                <select
                  value={formData.vehicle_interest}
                  onChange={(e) => setFormData({ ...formData, vehicle_interest: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors"
                >
                  <option value="">Not specified</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Notes</label>
                <textarea
                  placeholder="Rental dates, preferences, etc..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-5 py-3 rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-50 font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  {saving ? "Saving..." : editingLead ? "Save Changes" : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_60px_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold">
                  Import Leads from CSV
                </h2>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {csvData.length === 0 ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-white/40 transition-colors"
                  >
                    <Upload className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                    <p className="text-sm text-white/50 mb-4">or click to browse</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-white/60 mb-2">Expected CSV format:</p>
                    <code className="text-xs text-white/40 block">
                      Name, Phone, Email, Notes<br />
                      John Smith, (555) 123-4567, john@email.com, Looking for Lamborghini Mar 15-20
                    </code>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {importResult && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${
                      importResult.failed === 0
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    }`}>
                      {importResult.failed === 0 ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span>
                        Imported {importResult.success} leads
                        {importResult.failed > 0 && `, ${importResult.failed} failed`}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold text-white/60 mb-3">Map your columns</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {csvHeaders.map(header => (
                        <div key={header} className="flex items-center gap-3">
                          <span className="text-sm text-white/50 w-32 truncate" title={header}>
                            {header}
                          </span>
                          <select
                            value={columnMapping[header] || ""}
                            onChange={(e) => setColumnMapping({
                              ...columnMapping,
                              [header]: e.target.value
                            })}
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/30"
                          >
                            <option value="">Skip</option>
                            <option value="name">Name *</option>
                            <option value="phone">Phone *</option>
                            <option value="email">Email</option>
                            <option value="notes">Notes</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/40 mt-2">* Required fields</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white/60 mb-3">
                      Preview ({csvData.length} rows)
                    </h3>
                    <div className="bg-white/5 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-48">
                        <table className="w-full text-sm">
                          <thead className="bg-white/5">
                            <tr>
                              {csvHeaders.slice(0, 4).map(header => (
                                <th key={header} className="px-4 py-2 text-left text-white/60 font-medium">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 5).map((row, i) => (
                              <tr key={i} className="border-t border-white/5">
                                {csvHeaders.slice(0, 4).map(header => (
                                  <td key={header} className="px-4 py-2 text-white/80 truncate max-w-[150px]">
                                    {row[header]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csvData.length > 5 && (
                        <div className="px-4 py-2 text-xs text-white/40 border-t border-white/5">
                          + {csvData.length - 5} more rows
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              {csvData.length > 0 && !importResult && (
                <button
                  onClick={resetImportModal}
                  className="px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
                >
                  Choose Different File
                </button>
              )}
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
              >
                {importResult ? "Close" : "Cancel"}
              </button>
              {csvData.length > 0 && !importResult && (
                <button
                  onClick={handleImport}
                  disabled={importing || !Object.values(columnMapping).includes("name") || !Object.values(columnMapping).includes("phone")}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-50 font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import {csvData.length} Leads
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal (for Pipeline View) - Two Column Layout */}
      {viewMode === "pipeline" && selectedLead && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLead(null)}>
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-[0_0_60px_rgba(255,255,255,0.1)]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ring-1 ${
                  isOnDoNotRentList(selectedLead)
                    ? "bg-gradient-to-br from-red-500/30 to-red-500/10 ring-red-500/30"
                    : "bg-gradient-to-br from-white/20 to-white/5 ring-white/10"
                }`}>
                  <span className={`text-lg font-semibold ${isOnDoNotRentList(selectedLead) ? "text-red-400" : "text-white"}`}>
                    {selectedLead.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-bold ${isOnDoNotRentList(selectedLead) ? "text-red-400" : "text-white"}`}>
                      {selectedLead.name}
                    </h3>
                    {/* Channel Badge */}
                    {(() => {
                      const channel = getChannelInfo(selectedLead.source)
                      const ChannelIcon = channel.icon
                      return (
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${channel.color}`}>
                          <ChannelIcon className="w-3 h-3" />
                          {channel.label}
                        </span>
                      )
                    })()}
                    {isOnDoNotRentList(selectedLead) && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">
                        <AlertTriangle className="w-3 h-3" />
                        DNR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedLead.phone}
                    </span>
                    {selectedLead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedLead.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedLead)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(selectedLead.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - Lead Information (35%) */}
              <div className="w-[35%] border-r border-white/10 overflow-y-auto p-4 space-y-4 flex-shrink-0">
                {/* Status */}
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {pipelineColumns.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => handleStatusChange(selectedLead.id, col.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          selectedLead.status === col.id
                            ? `${col.color} ${col.glow} ${col.textGlow}`
                            : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Cards */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Car className="w-4 h-4 text-white/40" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">Vehicle Interest</span>
                    </div>
                    <p className="text-sm font-medium">{getVehicleName(selectedLead.vehicle_interest) || "Not specified"}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Calendar className="w-4 h-4 text-white/40" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">Created</span>
                    </div>
                    <p className="text-sm font-medium">{formatDate(selectedLead.created_at)}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock className="w-4 h-4 text-white/40" />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">Last Activity</span>
                    </div>
                    <p className="text-sm font-medium">
                      {selectedLead.last_message_time
                        ? formatDistanceToNow(new Date(selectedLead.last_message_time), { addSuffix: true })
                        : "No messages"}
                    </p>
                  </div>

                  {selectedLead.notes && (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <StickyNote className="w-4 h-4 text-white/40" />
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Notes</span>
                      </div>
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{selectedLead.notes}</p>
                    </div>
                  )}
                </div>

                {/* Send Payment Link Button */}
                <button
                  onClick={() => openPaymentLinkModal(selectedLead)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                >
                  <CreditCard className="w-4 h-4" />
                  Send Payment Link
                </button>
              </div>

              {/* Right Side - Conversation (65%) */}
              <div className="flex-1 flex flex-col bg-black/30 min-w-0">
                {/* Conversation Header */}
                <div className="p-3 border-b border-white/[0.06] flex items-center gap-2 flex-shrink-0">
                  {(() => {
                    const channel = getChannelInfo(selectedLead.source)
                    const ChannelIcon = channel.icon
                    return (
                      <>
                        <ChannelIcon className={`w-4 h-4 ${channel.textColor}`} />
                        <span className="text-sm font-medium text-white/70">Conversation</span>
                        <span className="text-xs text-white/30">({messages.length} messages)</span>
                      </>
                    )
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-white/15" />
                      </div>
                      <p className="text-white/50 font-medium">No messages yet</p>
                      <p className="text-white/30 text-sm mt-1 max-w-[240px]">
                        Send a message to start the conversation
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <span className="px-3 py-1 bg-white/[0.04] rounded-full text-xs text-white/40">
                          {format(new Date(messages[0]?.created_at || new Date()), "MMMM d, yyyy")}
                        </span>
                      </div>

                      {messages.map((message, index) => {
                        const isOutbound = message.direction === "outbound"
                        const showTimestamp = index === messages.length - 1 ||
                          new Date(messages[index + 1]?.created_at).getTime() - new Date(message.created_at).getTime() > 300000

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[80%] ${isOutbound ? "items-end" : "items-start"}`}>
                              <div
                                className={`rounded-2xl px-4 py-2.5 ${
                                  isOutbound
                                    ? "bg-white text-black rounded-br-md"
                                    : "bg-white/[0.08] text-white rounded-bl-md"
                                }`}
                              >
                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              </div>
                              {showTimestamp && (
                                <div className={`flex items-center gap-1.5 mt-1.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
                                  {isOutbound && <CheckCheck className="w-3.5 h-3.5 text-white/30" />}
                                  <p className="text-[11px] text-white/30">
                                    {format(new Date(message.created_at), "h:mm a")}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2.5 bg-white hover:bg-white/90 disabled:opacity-50 text-black rounded-xl transition-all font-medium shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Link Modal */}
      {showPaymentLinkModal && paymentLinkLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.15)]">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Send Payment Link</h3>
                  <p className="text-sm text-white/50">to {paymentLinkLead.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentLinkModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentLinkSent ? (
              /* Success State */
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Payment Link Sent!</h4>
                <p className="text-sm text-white/50 mb-6">
                  The payment link has been sent to {paymentLinkLead.phone} via SMS
                </p>
                <button
                  onClick={() => setShowPaymentLinkModal(false)}
                  className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form State */
              <div className="p-4 space-y-4">
                {paymentLinkError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {paymentLinkError}
                  </div>
                )}

                {/* Vehicle Selection */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">Vehicle</label>
                  <select
                    value={paymentLinkData.vehicleId}
                    onChange={(e) => updatePaymentLinkField('vehicleId', e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model} - ${v.daily_rate}/day
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={paymentLinkData.startDate}
                      onChange={(e) => updatePaymentLinkField('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">End Date</label>
                    <input
                      type="date"
                      value={paymentLinkData.endDate}
                      onChange={(e) => updatePaymentLinkField('endDate', e.target.value)}
                      min={paymentLinkData.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                {/* Amount Summary */}
                {paymentLinkData.totalAmount > 0 && (
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">
                        {(() => {
                          const { days } = calculatePaymentAmounts(paymentLinkData.vehicleId, paymentLinkData.startDate, paymentLinkData.endDate)
                          return `${days || 1} day${(days || 1) > 1 ? 's' : ''} rental`
                        })()}
                      </span>
                      <span className="text-white/70">${paymentLinkData.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                      <span className="font-medium">Deposit (25%)</span>
                      <span className="text-lg font-bold text-emerald-400">${paymentLinkData.depositAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Send Button */}
                <button
                  onClick={sendPaymentLink}
                  disabled={sendingPaymentLink || !paymentLinkData.vehicleId || !paymentLinkData.startDate || !paymentLinkData.endDate}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {sendingPaymentLink ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send via SMS
                    </>
                  )}
                </button>

                <p className="text-xs text-white/30 text-center">
                  Payment link will be sent to {paymentLinkLead.phone}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
