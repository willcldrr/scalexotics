"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Users,
  Shield,
  FileText,
  Globe,
  Search,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  User,
  Calendar,
  MapPin,
  Edit,
  Copy,
  ExternalLink,
  Building,
  RefreshCw,
  Receipt,
  LogIn,
  Save,
} from "lucide-react"
import { format } from "date-fns"

// ============================================
// TYPES
// ============================================

interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  company_name: string | null
  phone: string | null
  is_admin: boolean
  created_at: string
  // Business info if exists
  business?: {
    id: string
    name: string
    status: string
    payment_domain: string | null
    stripe_connected: boolean
  } | null
}

interface DoNotRentEntry {
  id: string
  full_name: string
  date_of_birth: string | null
  expiration_date: string | null
  issuing_state: string | null
  id_number: string | null
  phone: string | null
  email: string | null
  reason: string | null
  created_at: string
}

interface Invoice {
  id: string
  invoice_number: string
  type: "retainer" | "booking"
  base_amount: number
  ad_spend_rate: number | null
  ad_spend_days: number | null
  ad_spend_total: number | null
  total_amount: number
  booking_description: string | null
  client_name: string
  client_email: string | null
  client_phone: string | null
  status: "pending" | "paid" | "cancelled"
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
}

interface CustomDomain {
  id: string
  user_id: string
  domain: string
  verified: boolean
  verification_token: string
  ssl_status: string
  created_at: string
  profiles?: {
    company_name: string | null
    email: string | null
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<"users" | "do-not-rent" | "invoices" | "domains">("users")

  // Users tab state
  const [users, setUsers] = useState<UserProfile[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [editingProfile, setEditingProfile] = useState<{
    full_name: string
    email: string
    company_name: string
    phone: string
  } | null>(null)
  const [impersonating, setImpersonating] = useState(false)

  // Do Not Rent tab state
  const [dnrEntries, setDnrEntries] = useState<DoNotRentEntry[]>([])
  const [dnrSearch, setDnrSearch] = useState("")
  const [showDnrAddModal, setShowDnrAddModal] = useState(false)
  const [editingDnrEntry, setEditingDnrEntry] = useState<DoNotRentEntry | null>(null)
  const [showDnrImportModal, setShowDnrImportModal] = useState(false)
  const [csvData, setCsvData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null)
  const dnrFileInputRef = useRef<HTMLInputElement>(null)
  const [dnrFormData, setDnrFormData] = useState({
    full_name: "",
    date_of_birth: "",
    expiration_date: "",
    issuing_state: "",
    id_number: "",
    phone: "",
    email: "",
    reason: "",
  })

  // Invoices tab state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null)
  const [newInvoice, setNewInvoice] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    bookingCredits: 10,
    pricePerBooking: 125,
    includeAdSpend: false,
    dailyAdSpend: 50,
    adSpendDays: 30,
    notes: "",
    dueDate: "",
  })

  // Domains tab state
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [domainUsers, setDomainUsers] = useState<any[]>([])
  const [domainSearch, setDomainSearch] = useState("")
  const [showDomainModal, setShowDomainModal] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<CustomDomain | null>(null)
  const [deletingDomain, setDeletingDomain] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  // Shared state
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      setLoading(false)
      return
    }

    setIsAdmin(true)
    await Promise.all([
      fetchUsers(),
      fetchDnrEntries(),
      fetchInvoices(),
      fetchDomains(),
      fetchDomainUsers(),
    ])
    setLoading(false)
  }

  // ============================================
  // USERS TAB FUNCTIONS
  // ============================================

  const fetchUsers = async () => {
    // Fetch all profiles (users)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profiles) {
      // Fetch businesses to join with profiles
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name, status, payment_domain, stripe_connected, owner_user_id")

      // Map profiles with their business info
      const usersWithBusiness = profiles.map(profile => ({
        ...profile,
        business: businesses?.find(b => b.owner_user_id === profile.id) || null
      }))

      setUsers(usersWithBusiness)
    }
  }

  const handleApprove = async (businessId: string) => {
    setSaving(true)
    const { error } = await supabase
      .from("businesses")
      .update({ status: "active" })
      .eq("id", businessId)

    if (error) {
      setMessage({ type: "error", text: "Failed to approve business" })
    } else {
      setMessage({ type: "success", text: "Business approved successfully!" })
      fetchUsers()
    }
    setSaving(false)
  }

  const handleDeny = async (businessId: string) => {
    if (!confirm("Are you sure you want to deny this business? This will mark them as suspended.")) return

    setSaving(true)
    const { error } = await supabase
      .from("businesses")
      .update({ status: "suspended" })
      .eq("id", businessId)

    if (error) {
      setMessage({ type: "error", text: "Failed to deny business" })
    } else {
      setMessage({ type: "success", text: "Business denied" })
      fetchUsers()
    }
    setSaving(false)
  }

  const handleDeleteUser = async (userId: string, businessId?: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return

    // Delete business if exists
    if (businessId) {
      await supabase.from("businesses").delete().eq("id", businessId)
    }

    // Note: We can't delete from auth.users via client, only from profiles
    const { error } = await supabase.from("profiles").delete().eq("id", userId)

    if (error) {
      setMessage({ type: "error", text: "Failed to delete user" })
    } else {
      setMessage({ type: "success", text: "User deleted" })
      fetchUsers()
    }
  }

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !currentlyAdmin })
      .eq("id", userId)

    if (error) {
      setMessage({ type: "error", text: "Failed to update admin status" })
    } else {
      setMessage({ type: "success", text: currentlyAdmin ? "Admin access removed" : "Admin access granted" })
      fetchUsers()
    }
  }

  const handleSaveProfile = async () => {
    if (!selectedUser || !editingProfile) return
    setSaving(true)

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editingProfile.full_name || null,
        company_name: editingProfile.company_name || null,
        phone: editingProfile.phone || null,
      })
      .eq("id", selectedUser.id)

    if (error) {
      setMessage({ type: "error", text: "Failed to update profile" })
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" })
      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? {
        ...u,
        full_name: editingProfile.full_name,
        company_name: editingProfile.company_name,
        phone: editingProfile.phone,
      } : u))
      setSelectedUser({
        ...selectedUser,
        full_name: editingProfile.full_name,
        company_name: editingProfile.company_name,
        phone: editingProfile.phone,
      })
    }
    setSaving(false)
  }

  const handleImpersonate = async (userId: string) => {
    if (!confirm("You are about to log in as this user. Continue?")) return

    setImpersonating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setMessage({ type: "error", text: "Not authenticated" })
        setImpersonating(false)
        return
      }

      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to impersonate user" })
        setImpersonating(false)
        return
      }

      // Store original admin session for returning later
      localStorage.setItem("admin_return_token", session.access_token)

      // Set the new session
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })

      // Redirect to dashboard
      toast.success(`Now logged in as ${selectedUser?.full_name || selectedUser?.email}`)
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Impersonation error:", error)
      setMessage({ type: "error", text: "Failed to impersonate user" })
      setImpersonating(false)
    }
  }

  const openUserSettings = (user: UserProfile) => {
    setSelectedUser(user)
    setEditingProfile({
      full_name: user.full_name || "",
      email: user.email || "",
      company_name: user.company_name || "",
      phone: user.phone || "",
    })
  }

  // Users with pending businesses
  const pendingUsers = users.filter(u => u.business?.status === "pending")
  // Other users
  const otherUsers = users.filter(u => u.business?.status !== "pending")

  const filteredUsers = [...pendingUsers, ...otherUsers].filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.company_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.business?.name?.toLowerCase().includes(userSearch.toLowerCase())
  )

  // ============================================
  // DO NOT RENT TAB FUNCTIONS
  // ============================================

  const fetchDnrEntries = async () => {
    const { data } = await supabase
      .from("do_not_rent_list")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setDnrEntries(data)
    }
  }

  const handleDnrSave = async () => {
    if (!dnrFormData.full_name.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const entryData = {
      full_name: dnrFormData.full_name.trim(),
      date_of_birth: dnrFormData.date_of_birth || null,
      expiration_date: dnrFormData.expiration_date || null,
      issuing_state: dnrFormData.issuing_state || null,
      id_number: dnrFormData.id_number || null,
      phone: dnrFormData.phone || null,
      email: dnrFormData.email || null,
      reason: dnrFormData.reason || null,
      added_by: user?.id,
    }

    if (editingDnrEntry) {
      await supabase.from("do_not_rent_list").update(entryData).eq("id", editingDnrEntry.id)
    } else {
      await supabase.from("do_not_rent_list").insert(entryData)
    }

    setSaving(false)
    setShowDnrAddModal(false)
    setEditingDnrEntry(null)
    resetDnrForm()
    fetchDnrEntries()
  }

  const handleDnrDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this person from the Do Not Rent list?")) return
    await supabase.from("do_not_rent_list").delete().eq("id", id)
    fetchDnrEntries()
  }

  const resetDnrForm = () => {
    setDnrFormData({
      full_name: "",
      date_of_birth: "",
      expiration_date: "",
      issuing_state: "",
      id_number: "",
      phone: "",
      email: "",
      reason: "",
    })
  }

  const openDnrEditModal = (entry: DoNotRentEntry) => {
    setEditingDnrEntry(entry)
    setDnrFormData({
      full_name: entry.full_name,
      date_of_birth: entry.date_of_birth || "",
      expiration_date: entry.expiration_date || "",
      issuing_state: entry.issuing_state || "",
      id_number: entry.id_number || "",
      phone: entry.phone || "",
      email: entry.email || "",
      reason: entry.reason || "",
    })
    setShowDnrAddModal(true)
  }

  const handleDnrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseDnrCSV(text)
    }
    reader.readAsText(file)
  }

  const parseDnrCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length < 2) {
      toast.error("Invalid CSV file", { description: "File appears to be empty or has no data rows" })
      return
    }

    const firstLine = lines[0]
    let delimiter = ","
    if (firstLine.includes("\t")) delimiter = "\t"
    else if (firstLine.split(";").length > firstLine.split(",").length) delimiter = ";"

    const headers = lines[0].split(delimiter).map(h =>
      h.toLowerCase().trim().replace(/['"]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    )

    const findColumn = (variations: string[]): number => {
      for (const v of variations) {
        const idx = headers.findIndex(h => h.includes(v) || v.includes(h))
        if (idx !== -1) return idx
      }
      return -1
    }

    const nameIdx = findColumn(["full_name", "fullname", "name", "customer_name", "customer", "renter", "driver"])
    const dobIdx = findColumn(["date_of_birth", "dob", "birth", "birthdate"])
    const expIdx = findColumn(["expiration", "expiration_date", "exp", "expires"])
    const stateIdx = findColumn(["state", "issuing_state", "issue_state", "dl_state"])
    const idIdx = findColumn(["id", "id_number", "license", "license_number", "dl"])
    const phoneIdx = findColumn(["phone", "phone_number", "tel", "mobile"])
    const emailIdx = findColumn(["email", "email_address"])
    const reasonIdx = findColumn(["reason", "notes", "note", "comments"])

    const rows: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ""))
      const name = nameIdx !== -1 ? values[nameIdx] : values[0]
      if (!name) continue

      rows.push({
        full_name: name,
        date_of_birth: dobIdx !== -1 ? values[dobIdx] : "",
        issuing_state: stateIdx !== -1 ? values[stateIdx] : "",
        id: idIdx !== -1 ? values[idIdx] : "",
        phone: phoneIdx !== -1 ? values[phoneIdx] : "",
        email: emailIdx !== -1 ? values[emailIdx] : "",
        reason: reasonIdx !== -1 ? values[reasonIdx] : "",
        expiration_date: expIdx !== -1 ? values[expIdx] : "",
      })
    }

    if (rows.length === 0) {
      toast.error("No valid entries found", { description: "Make sure your CSV has a column for names" })
      return
    }

    setCsvData(rows)
    setShowDnrImportModal(true)
    setImportResult(null)
  }

  const handleDnrImport = async () => {
    setImporting(true)
    let success = 0
    let errors = 0

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Authentication required", { description: "You must be logged in to import entries" })
      setImporting(false)
      return
    }

    const entries = csvData.map(row => ({
      full_name: row.full_name?.trim() || "",
      date_of_birth: row.date_of_birth || null,
      expiration_date: row.expiration_date || null,
      issuing_state: row.issuing_state?.trim() || null,
      id_number: row.id?.trim() || null,
      phone: row.phone?.trim() || null,
      email: row.email?.trim() || null,
      reason: row.reason?.trim() || null,
      added_by: user.id,
    })).filter(e => e.full_name)

    const batchSize = 50
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize)
      const { error } = await supabase.from("do_not_rent_list").insert(batch)
      if (error) {
        errors += batch.length
      } else {
        success += batch.length
      }
    }

    setImportResult({ success, errors })
    setImporting(false)
    fetchDnrEntries()
  }

  const filteredDnrEntries = dnrEntries.filter(entry =>
    entry.full_name.toLowerCase().includes(dnrSearch.toLowerCase()) ||
    entry.issuing_state?.toLowerCase().includes(dnrSearch.toLowerCase()) ||
    entry.id_number?.toLowerCase().includes(dnrSearch.toLowerCase())
  )

  // ============================================
  // INVOICES TAB FUNCTIONS
  // ============================================

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from("client_invoices")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setInvoices(data)
    }
  }

  const bookingTotal = newInvoice.bookingCredits * newInvoice.pricePerBooking
  const adSpendTotal = newInvoice.includeAdSpend ? newInvoice.dailyAdSpend * newInvoice.adSpendDays : 0
  const grandTotal = bookingTotal + adSpendTotal

  const handleCreateInvoice = async () => {
    if (!newInvoice.clientName.trim()) {
      setMessage({ type: "error", text: "Client name is required" })
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from("client_invoices").insert({
      type: "booking",
      base_amount: bookingTotal,
      ad_spend_rate: newInvoice.includeAdSpend ? newInvoice.dailyAdSpend : null,
      ad_spend_days: newInvoice.includeAdSpend ? newInvoice.adSpendDays : null,
      ad_spend_total: newInvoice.includeAdSpend ? adSpendTotal : null,
      total_amount: grandTotal,
      booking_description: `${newInvoice.bookingCredits} booking credits @ $${newInvoice.pricePerBooking}/booking`,
      client_name: newInvoice.clientName,
      client_email: newInvoice.clientEmail || null,
      client_phone: newInvoice.clientPhone || null,
      notes: newInvoice.notes || null,
      due_date: newInvoice.dueDate || null,
      created_by: user?.id,
    })

    if (error) {
      setMessage({ type: "error", text: "Failed to create invoice" })
    } else {
      setMessage({ type: "success", text: "Invoice created!" })
      setShowInvoiceModal(false)
      setNewInvoice({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        bookingCredits: 10,
        pricePerBooking: 125,
        includeAdSpend: false,
        dailyAdSpend: 50,
        adSpendDays: 30,
        notes: "",
        dueDate: "",
      })
      fetchInvoices()
    }
    setSaving(false)
  }

  const copyInvoiceLink = async (invoiceId: string) => {
    const link = `${window.location.origin}/pay/${invoiceId}`
    await navigator.clipboard.writeText(link)
    setCopiedInvoiceId(invoiceId)
    setTimeout(() => setCopiedInvoiceId(null), 2000)
  }

  const updateInvoiceStatus = async (invoiceId: string, status: "pending" | "paid" | "cancelled") => {
    const updates: any = { status }
    if (status === "paid") updates.paid_at = new Date().toISOString()

    const { error } = await supabase.from("client_invoices").update(updates).eq("id", invoiceId)
    if (error) {
      setMessage({ type: "error", text: "Failed to update invoice" })
    } else {
      fetchInvoices()
    }
  }

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return
    const { error } = await supabase.from("client_invoices").delete().eq("id", invoiceId)
    if (error) {
      setMessage({ type: "error", text: "Failed to delete invoice" })
    } else {
      setMessage({ type: "success", text: "Invoice deleted" })
      fetchInvoices()
    }
  }

  const invoiceStats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === "pending").length,
    paid: invoices.filter(i => i.status === "paid").length,
    revenue: invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total_amount, 0),
  }

  // ============================================
  // DOMAINS TAB FUNCTIONS
  // ============================================

  const fetchDomains = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    try {
      const response = await fetch("/api/admin/domains", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setDomains(data.domains || [])
      }
    } catch (e) {
      // Domains API might not exist
    }
  }

  const fetchDomainUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, company_name, email, full_name")
      .order("company_name", { ascending: true })

    if (data) {
      setDomainUsers(data)
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim() || !selectedUserId) {
      setMessage({ type: "error", text: "Please enter a domain and select a user" })
      return
    }

    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setMessage({ type: "error", text: "Not authenticated" })
      setSaving(false)
      return
    }

    const response = await fetch("/api/admin/domains", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domain: newDomain.trim(), userId: selectedUserId }),
    })

    const data = await response.json()

    if (response.ok) {
      await fetchDomains()
      setShowDomainModal(false)
      setNewDomain("")
      setSelectedUserId("")
    } else {
      setMessage({ type: "error", text: data.error || "Failed to add domain" })
    }

    setSaving(false)
  }

  const deleteDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Are you sure you want to delete ${domainName}?`)) return

    setDeletingDomain(domainId)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setDeletingDomain(null)
      return
    }

    const response = await fetch(`/api/admin/domains?id=${domainId}&domain=${domainName}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (response.ok) {
      setDomains(domains.filter(d => d.id !== domainId))
    }

    setDeletingDomain(null)
  }

  const copyDomainToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const getDomainStatusBadge = (domain: CustomDomain) => {
    if (domain.verified && domain.ssl_status === "active") {
      return { icon: CheckCircle, label: "Active", color: "bg-green-500/20 text-green-400" }
    }
    if (domain.ssl_status === "added_to_vercel") {
      return { icon: Clock, label: "Pending DNS", color: "bg-yellow-500/20 text-yellow-400" }
    }
    return { icon: AlertCircle, label: "Pending", color: "bg-orange-500/20 text-orange-400" }
  }

  const filteredDomains = domains.filter(domain =>
    domain.domain.toLowerCase().includes(domainSearch.toLowerCase()) ||
    domain.profiles?.company_name?.toLowerCase().includes(domainSearch.toLowerCase())
  )

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // ============================================
  // LOADING & ACCESS DENIED STATES
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-white/50">You don't have permission to access this page.</p>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-white/50 mt-1">Manage users, domains, invoices, and more</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {[
          { key: "users", label: "Users", icon: Users, count: users.length },
          { key: "do-not-rent", label: "Do Not Rent", icon: Shield, count: dnrEntries.length },
          { key: "invoices", label: "Invoices", icon: FileText, count: invoices.length },
          { key: "domains", label: "Domains", icon: Globe, count: domains.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-white text-black shadow-lg shadow-white/25"
                : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-black/20" : "bg-white/10"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === "success"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {message.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========== USERS TAB ========== */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-white/50 text-sm">Total Users</div>
              <div className="text-2xl font-bold mt-1">{users.length}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-white/50 text-sm">Pending Approval</div>
              <div className="text-2xl font-bold mt-1 text-amber-400">{pendingUsers.length}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-white/50 text-sm">Active</div>
              <div className="text-2xl font-bold mt-1 text-green-400">{users.filter(u => u.business?.status === "active").length}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-white/50 text-sm">Admins</div>
              <div className="text-2xl font-bold mt-1 text-purple-400">{users.filter(u => u.is_admin).length}</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Users List */}
          <div className="bg-black rounded-2xl border border-white/[0.08] overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-white/50 text-sm">Users will appear here once they sign up</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        user.is_admin ? "bg-purple-500/20" :
                        user.business?.status === "pending" ? "bg-amber-500/20" :
                        user.business?.status === "active" ? "bg-green-500/20" :
                        "bg-white/10"
                      }`}>
                        <User className={`w-6 h-6 ${
                          user.is_admin ? "text-purple-400" :
                          user.business?.status === "pending" ? "text-amber-400" :
                          user.business?.status === "active" ? "text-green-400" :
                          "text-white/60"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{user.full_name || user.email?.split("@")[0] || "Unknown"}</p>
                          {user.is_admin && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                              Admin
                            </span>
                          )}
                          {user.business && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.business.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                              user.business.status === "active" ? "bg-green-500/20 text-green-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {user.business.status}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/50">{user.email}</p>
                        {user.company_name && (
                          <p className="text-xs text-white/30">{user.company_name}</p>
                        )}
                        {user.business?.payment_domain && (
                          <p className="text-xs text-white/30">Domain: {user.business.payment_domain}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Quick approve/deny for pending users */}
                      {user.business?.status === "pending" && (
                        <>
                          <button
                            onClick={() => user.business && handleApprove(user.business.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button
                            onClick={() => user.business && handleDeny(user.business.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            title="Deny"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Deny</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openUserSettings(user)}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        title="Manage User"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== DO NOT RENT TAB ========== */}
      {activeTab === "do-not-rent" && (
        <div className="space-y-6">
          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Total Entries</p>
                <p className="text-2xl font-bold">{dnrEntries.length}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="file"
                ref={dnrFileInputRef}
                onChange={handleDnrFileUpload}
                accept=".csv,.tsv,.txt"
                className="hidden"
              />
              <button
                onClick={() => dnrFileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </button>
              <button
                onClick={() => {
                  resetDnrForm()
                  setEditingDnrEntry(null)
                  setShowDnrAddModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search by name, state, or ID..."
              value={dnrSearch}
              onChange={(e) => setDnrSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/40 focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>

          {/* Entries list */}
          <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
            {filteredDnrEntries.length === 0 ? (
              <div className="py-16 text-center">
                <AlertTriangle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {dnrEntries.length === 0 ? "No entries yet" : "No matches found"}
                </h3>
                <p className="text-white/50 text-sm">
                  {dnrEntries.length === 0 ? "Upload a CSV or add entries manually" : "Try adjusting your search"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-white/50">Name</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-white/50">DOB</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-white/50">ID Number</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-white/50">State</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-white/50">Reason</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-white/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredDnrEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-red-400" />
                            </div>
                            <span className="font-medium text-red-400">{entry.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/60">
                          {entry.date_of_birth ? format(new Date(entry.date_of_birth), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-6 py-4 text-white/60 font-mono text-sm">{entry.id_number || "—"}</td>
                        <td className="px-6 py-4 text-white/60">{entry.issuing_state || "—"}</td>
                        <td className="px-6 py-4 text-white/60 max-w-[200px] truncate">{entry.reason || "—"}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDnrEditModal(entry)}
                              className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDnrDelete(entry.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== INVOICES TAB ========== */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-white/50">Create and manage B2B invoices for fleet partners</p>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 text-black font-medium rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-white/50 text-sm">Total Invoices</div>
              <div className="text-2xl font-bold mt-1">{invoiceStats.total}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-white/50 text-sm">Pending</div>
              <div className="text-2xl font-bold mt-1 text-yellow-400">{invoiceStats.pending}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-white/50 text-sm">Paid</div>
              <div className="text-2xl font-bold mt-1 text-green-400">{invoiceStats.paid}</div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="text-white/50 text-sm">Total Revenue</div>
              <div className="text-2xl font-bold mt-1 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{formatCurrency(invoiceStats.revenue)}</div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Invoice</th>
                      <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Client</th>
                      <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Amount</th>
                      <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Status</th>
                      <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Created</th>
                      <th className="text-right text-sm font-medium text-white/50 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-sm">{invoice.invoice_number}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{invoice.client_name}</div>
                          {invoice.client_email && <div className="text-sm text-white/50">{invoice.client_email}</div>}
                        </td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(invoice.total_amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === "paid" ? "bg-green-500/20 text-green-400" :
                            invoice.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {invoice.status === "paid" && <CheckCircle className="w-3 h-3" />}
                            {invoice.status === "cancelled" && <XCircle className="w-3 h-3" />}
                            {invoice.status === "pending" && <Clock className="w-3 h-3" />}
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/50">{formatDate(invoice.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyInvoiceLink(invoice.id)}
                              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              title="Copy payment link"
                            >
                              {copiedInvoiceId === invoice.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <a
                              href={`/pay/${invoice.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            {invoice.status === "pending" && (
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                                className="p-2 text-white/50 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                title="Mark as paid"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteInvoice(invoice.id)}
                              className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== DOMAINS TAB ========== */}
      {activeTab === "domains" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-white/50">{domains.length} custom domains configured</p>
            <button
              onClick={() => setShowDomainModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 text-black font-medium rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Domain
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Total Domains</p>
                  <p className="text-2xl font-bold">{domains.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Active</p>
                  <p className="text-2xl font-bold">{domains.filter(d => d.verified && d.ssl_status === "active").length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Pending Setup</p>
                  <p className="text-2xl font-bold">{domains.filter(d => !d.verified || d.ssl_status !== "active").length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search domains..."
              value={domainSearch}
              onChange={(e) => setDomainSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Domain List */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {filteredDomains.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/40">
                <Globe className="w-12 h-12 mb-3" />
                <p>No domains configured</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredDomains.map((domain) => {
                  const status = getDomainStatusBadge(domain)
                  return (
                    <div key={domain.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{domain.domain}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                              <status.icon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-white/50 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {domain.profiles?.company_name || "No company"}
                            </span>
                            <span>Added {format(new Date(domain.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedDomain(domain)}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteDomain(domain.id, domain.domain)}
                            disabled={deletingDomain === domain.id}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                          >
                            {deletingDomain === domain.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== MODALS ========== */}

      {/* User Settings Modal */}
      {selectedUser && editingProfile && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  selectedUser.is_admin ? "bg-purple-500/20" :
                  selectedUser.business?.status === "pending" ? "bg-amber-500/20" :
                  selectedUser.business?.status === "active" ? "bg-green-500/20" :
                  "bg-white/10"
                }`}>
                  <User className={`w-7 h-7 ${
                    selectedUser.is_admin ? "text-purple-400" :
                    selectedUser.business?.status === "pending" ? "text-amber-400" :
                    selectedUser.business?.status === "active" ? "text-green-400" :
                    "text-white/60"
                  }`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.full_name || selectedUser.email}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.is_admin && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">Admin</span>
                    )}
                    {selectedUser.business && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.business.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                        selectedUser.business.status === "active" ? "bg-green-500/20 text-green-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {selectedUser.business.status}
                      </span>
                    )}
                    <span className="text-xs text-white/40">Joined {formatDate(selectedUser.created_at)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedUser(null); setEditingProfile(null); }} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Information - Editable */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editingProfile.full_name}
                      onChange={(e) => setEditingProfile({ ...editingProfile, full_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingProfile.email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-white/30 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={editingProfile.company_name}
                      onChange={(e) => setEditingProfile({ ...editingProfile, company_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                      placeholder="Acme Rentals"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editingProfile.phone}
                      onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              {selectedUser.business && (
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Business Information</h3>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/50">Business Name</p>
                        <p className="font-medium">{selectedUser.business.name}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Status</p>
                        <p className={`font-medium capitalize ${
                          selectedUser.business.status === "active" ? "text-green-400" :
                          selectedUser.business.status === "pending" ? "text-amber-400" :
                          "text-red-400"
                        }`}>{selectedUser.business.status}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Payment Domain</p>
                        <p className="font-medium">{selectedUser.business.payment_domain || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Stripe Connected</p>
                        <p className={`font-medium ${selectedUser.business.stripe_connected ? "text-green-400" : "text-white/50"}`}>
                          {selectedUser.business.stripe_connected ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Admin Toggle */}
                  <button
                    onClick={() => toggleAdmin(selectedUser.id, selectedUser.is_admin)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                      selectedUser.is_admin
                        ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    {selectedUser.is_admin ? "Remove Admin Access" : "Grant Admin Access"}
                  </button>

                  {/* Business Status Actions */}
                  {selectedUser.business?.status === "pending" && (
                    <>
                      <button
                        onClick={() => { handleApprove(selectedUser.business!.id); fetchUsers(); }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Business
                      </button>
                      <button
                        onClick={() => { handleDeny(selectedUser.business!.id); fetchUsers(); }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl border border-red-500/30"
                      >
                        <XCircle className="w-4 h-4" />
                        Deny Business
                      </button>
                    </>
                  )}
                  {selectedUser.business?.status === "active" && (
                    <button
                      onClick={() => { handleDeny(selectedUser.business!.id); fetchUsers(); }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl border border-red-500/30"
                    >
                      <XCircle className="w-4 h-4" />
                      Suspend Business
                    </button>
                  )}
                  {selectedUser.business?.status === "suspended" && (
                    <button
                      onClick={() => { handleApprove(selectedUser.business!.id); fetchUsers(); }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium rounded-xl border border-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Reactivate Business
                    </button>
                  )}

                  {/* Delete User */}
                  <button
                    onClick={() => { handleDeleteUser(selectedUser.id, selectedUser.business?.id); setSelectedUser(null); setEditingProfile(null); }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl border border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </button>
                </div>
              </div>

              {/* Impersonation Section */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <LogIn className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-400">Log In As User</h3>
                    <p className="text-sm text-white/50 mt-1">
                      Access this user's account to help configure their settings.
                    </p>
                    <button
                      onClick={() => handleImpersonate(selectedUser.id)}
                      disabled={impersonating}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      {impersonating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          Log In As {selectedUser.full_name?.split(" ")[0] || "User"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-between">
              <button
                onClick={() => { setSelectedUser(null); setEditingProfile(null); }}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-white/90 text-black font-medium rounded-xl disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Do Not Rent Add/Edit Modal */}
      {showDnrAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] rounded-2xl border border-white/[0.08] w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <h2 className="text-lg font-bold">{editingDnrEntry ? "Edit Entry" : "Add to Do Not Rent List"}</h2>
              <button onClick={() => { setShowDnrAddModal(false); setEditingDnrEntry(null); resetDnrForm(); }} className="p-2 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={dnrFormData.full_name}
                  onChange={(e) => setDnrFormData({ ...dnrFormData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={dnrFormData.date_of_birth}
                    onChange={(e) => setDnrFormData({ ...dnrFormData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">ID Expiration</label>
                  <input
                    type="date"
                    value={dnrFormData.expiration_date}
                    onChange={(e) => setDnrFormData({ ...dnrFormData, expiration_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">ID Number</label>
                  <input
                    type="text"
                    value={dnrFormData.id_number}
                    onChange={(e) => setDnrFormData({ ...dnrFormData, id_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                    placeholder="DL12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Issuing State</label>
                  <input
                    type="text"
                    value={dnrFormData.issuing_state}
                    onChange={(e) => setDnrFormData({ ...dnrFormData, issuing_state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                    placeholder="CA"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Reason for Ban</label>
                <textarea
                  value={dnrFormData.reason}
                  onChange={(e) => setDnrFormData({ ...dnrFormData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 resize-none"
                  placeholder="Describe why this person is banned..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowDnrAddModal(false); setEditingDnrEntry(null); resetDnrForm(); }}
                  className="flex-1 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDnrSave}
                  disabled={saving || !dnrFormData.full_name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingDnrEntry ? "Save Changes" : "Add to List"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Do Not Rent Import Modal */}
      {showDnrImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] rounded-2xl border border-white/[0.08] w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold">Import CSV</h2>
              </div>
              <button onClick={() => { setShowDnrImportModal(false); setCsvData([]); setImportResult(null); }} className="p-2 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {importResult ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Import Complete</h3>
                  <p className="text-white/60 mb-4">
                    Successfully imported {importResult.success} entries
                    {importResult.errors > 0 && ` (${importResult.errors} errors)`}
                  </p>
                  <button
                    onClick={() => { setShowDnrImportModal(false); setCsvData([]); setImportResult(null); }}
                    className="px-6 py-3 bg-white hover:bg-white/90 text-black font-semibold rounded-xl"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-white/60 mb-4">Found <span className="text-white font-semibold">{csvData.length}</span> entries to import.</p>
                  <div className="bg-black/50 rounded-xl border border-white/[0.08] overflow-hidden mb-6 max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-black">
                        <tr className="border-b border-white/[0.08]">
                          <th className="text-left px-4 py-3 text-white/50">Name</th>
                          <th className="text-left px-4 py-3 text-white/50">State</th>
                          <th className="text-left px-4 py-3 text-white/50">ID</th>
                          <th className="text-left px-4 py-3 text-white/50">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {csvData.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-white">{row.full_name}</td>
                            <td className="px-4 py-3 text-white/60">{row.issuing_state || "—"}</td>
                            <td className="px-4 py-3 text-white/60 font-mono">{row.id || "—"}</td>
                            <td className="px-4 py-3 text-white/60 max-w-[150px] truncate">{row.reason || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.length > 10 && (
                      <p className="text-center text-white/40 text-sm py-3 border-t border-white/[0.08]">...and {csvData.length - 10} more</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDnrImportModal(false); setCsvData([]); }}
                      className="flex-1 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDnrImport}
                      disabled={importing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl"
                    >
                      {importing ? <><Loader2 className="w-5 h-5 animate-spin" />Importing...</> : <><Upload className="w-5 h-5" />Import {csvData.length} Entries</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Create Invoice</h3>
                  <p className="text-sm text-white/50">Velocity Labs Partner Invoice</p>
                </div>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                  <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs flex items-center justify-center">1</span>
                  Client Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Client Name *</label>
                    <input
                      type="text"
                      value={newInvoice.clientName}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                      placeholder="Miami Exotic Rentals"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <input
                      type="email"
                      value={newInvoice.clientEmail}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })}
                      placeholder="owner@company.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Credits */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                  <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs flex items-center justify-center">2</span>
                  Booking Credits
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Number of Credits</label>
                      <input
                        type="number"
                        value={newInvoice.bookingCredits}
                        onChange={(e) => setNewInvoice({ ...newInvoice, bookingCredits: parseInt(e.target.value) || 0 })}
                        min="1"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-medium focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Price per Booking ($)</label>
                      <input
                        type="number"
                        value={newInvoice.pricePerBooking}
                        onChange={(e) => setNewInvoice({ ...newInvoice, pricePerBooking: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-medium focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-white/60">Booking Credits Subtotal</span>
                    <span className="text-xl font-bold">{formatCurrency(bookingTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white/10 rounded-xl border border-white/30 p-5">
                <div className="text-sm font-medium text-white/60 mb-4">Invoice Summary</div>
                <div className="flex justify-between items-center pt-3 border-t border-white/20">
                  <span className="text-lg font-medium">Total Due</span>
                  <span className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-white/10">
              <button onClick={() => setShowInvoiceModal(false)} className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-white font-medium rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={saving || !newInvoice.clientName.trim()}
                className="flex-1 px-4 py-3 bg-white hover:bg-white/90 disabled:opacity-50 text-black font-medium rounded-xl flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Plus className="w-4 h-4" />Create Invoice</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Add Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Custom Domain</h2>
              <button onClick={() => { setShowDomainModal(false); setNewDomain(""); setSelectedUserId(""); }} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Domain Name</label>
                <input
                  type="text"
                  placeholder="rentals.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Assign to Client</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="">Select a client...</option>
                  {domainUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.company_name || user.full_name || user.email}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-white/70 font-medium mb-2">Next Steps:</p>
                <ol className="text-sm text-white/50 space-y-1 list-decimal list-inside">
                  <li>Domain added to Vercel automatically</li>
                  <li>Client configures DNS CNAME</li>
                  <li>SSL certificate provisioned</li>
                </ol>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => { setShowDomainModal(false); setNewDomain(""); setSelectedUserId(""); }} className="px-4 py-2 rounded-xl text-white/60 hover:text-white">
                Cancel
              </button>
              <button
                onClick={addDomain}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-white/90 rounded-xl text-black font-medium disabled:opacity-50"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Adding...</> : <><Plus className="w-4 h-4" />Add Domain</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Details Modal */}
      {selectedDomain && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedDomain.domain}</h2>
                <p className="text-sm text-white/50">{selectedDomain.profiles?.company_name || "Unassigned"}</p>
              </div>
              <button onClick={() => setSelectedDomain(null)} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Status</span>
                  {(() => {
                    const status = getDomainStatusBadge(selectedDomain)
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${status.color}`}>
                        <status.icon className="w-4 h-4" />
                        {status.label}
                      </span>
                    )
                  })()}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-3">DNS Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                    <span className="text-white/50">Type</span>
                    <span className="font-mono">CNAME</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                    <span className="text-white/50">Value</span>
                    <span className="font-mono">cname.vercel-dns.com</span>
                  </div>
                </div>
              </div>
              {selectedDomain.verification_token && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">Verification Token</h3>
                    <button onClick={() => copyDomainToken(selectedDomain.verification_token)} className="text-sm text-white hover:underline flex items-center gap-1">
                      {copiedToken ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-white/50 break-all">{selectedDomain.verification_token}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-white/10 flex justify-between">
              <button
                onClick={() => { deleteDomain(selectedDomain.id, selectedDomain.domain); setSelectedDomain(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete Domain
              </button>
              <button onClick={() => setSelectedDomain(null)} className="px-6 py-2 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
