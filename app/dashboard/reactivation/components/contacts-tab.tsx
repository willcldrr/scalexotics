"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Upload,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Car,
  UserPlus,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Trash2,
  Edit,
  Eye,
} from "lucide-react"

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string
  last_rental_date: string | null
  total_spend: number
  rental_count: number
  preferred_vehicle_type: string | null
  sms_opted_in: boolean
  email_opted_in: boolean
  tags: string[] | null
  created_at: string
  last_contacted_at: string | null
}

interface ContactsTabProps {
  userId: string
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  opted_out: "bg-red-500/20 text-red-400",
  converted: "bg-blue-500/20 text-blue-400",
  invalid: "bg-gray-500/20 text-gray-400",
}

export default function ContactsTab({ userId }: ContactsTabProps) {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [userId])

  const fetchContacts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("reactivation_contacts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (data) {
      setContacts(data)
    }
    setLoading(false)
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: contacts.length,
    active: contacts.filter((c) => c.status === "active").length,
    smsOptedIn: contacts.filter((c) => c.sms_opted_in).length,
    emailOptedIn: contacts.filter((c) => c.email_opted_in).length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Total Contacts</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Active</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">SMS Opted In</p>
          <p className="text-2xl font-bold mt-1">{stats.smsOptedIn}</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Email Opted In</p>
          <p className="text-2xl font-bold mt-1">{stats.emailOptedIn}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#375DEE]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#375DEE]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="opted_out">Opted Out</option>
            <option value="converted">Converted</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Contact
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] rounded-lg text-white hover:bg-[#375DEE]/80 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#375DEE] border-t-transparent rounded-full mx-auto" />
            <p className="text-white/50 mt-4">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
            <p className="text-white/50 mb-6">
              Import your past customers via CSV to start reactivation campaigns
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#375DEE] rounded-lg text-white hover:bg-[#375DEE]/80 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Import CSV
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/50 font-medium">Contact</th>
                  <th className="text-left p-4 text-white/50 font-medium">Status</th>
                  <th className="text-left p-4 text-white/50 font-medium">Last Rental</th>
                  <th className="text-left p-4 text-white/50 font-medium">Total Spend</th>
                  <th className="text-left p-4 text-white/50 font-medium">Channels</th>
                  <th className="text-left p-4 text-white/50 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-white/50">
                          {contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[contact.status] || statusColors.active
                        }`}
                      >
                        {contact.status}
                      </span>
                    </td>
                    <td className="p-4 text-white/70">
                      {contact.last_rental_date
                        ? new Date(contact.last_rental_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-4 text-white/70">
                      ${contact.total_spend?.toLocaleString() || "0"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {contact.sms_opted_in && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            SMS
                          </span>
                        )}
                        {contact.email_opted_in && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                            Email
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedContact(contact)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-white/60" />
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

      {/* CSV Import Modal */}
      {showImportModal && (
        <CSVImportModal
          userId={userId}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            fetchContacts()
          }}
        />
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchContacts()
          }}
        />
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onUpdate={fetchContacts}
        />
      )}
    </div>
  )
}

// CSV Import Modal Component
function CSVImportModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "complete">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ success: number; duplicates: number; failed: number } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const fieldOptions = [
    { value: "", label: "Skip this column" },
    { value: "name", label: "Name *" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "last_rental_date", label: "Last Rental Date" },
    { value: "total_spend", label: "Total Spend" },
    { value: "rental_count", label: "Rental Count" },
    { value: "preferred_vehicle_type", label: "Vehicle Preference" },
    { value: "birthday", label: "Birthday" },
    { value: "notes", label: "Notes" },
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file")
      return
    }
    setFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = text.split("\n").map((row) => {
        const result: string[] = []
        let current = ""
        let inQuotes = false
        for (let i = 0; i < row.length; i++) {
          const char = row[i]
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
      }).filter((row) => row.some((cell) => cell))

      if (rows.length > 0) {
        setHeaders(rows[0])
        setCsvData(rows.slice(1))

        // Auto-map columns based on header names
        const autoMapping: Record<string, string> = {}
        rows[0].forEach((header, index) => {
          const headerLower = header.toLowerCase()
          if (headerLower.includes("name") && !headerLower.includes("company")) {
            autoMapping[index.toString()] = "name"
          } else if (headerLower.includes("email")) {
            autoMapping[index.toString()] = "email"
          } else if (headerLower.includes("phone") || headerLower.includes("mobile") || headerLower.includes("cell")) {
            autoMapping[index.toString()] = "phone"
          } else if (headerLower.includes("rental") && headerLower.includes("date")) {
            autoMapping[index.toString()] = "last_rental_date"
          } else if (headerLower.includes("spend") || headerLower.includes("revenue") || headerLower.includes("total")) {
            autoMapping[index.toString()] = "total_spend"
          } else if (headerLower.includes("vehicle") || headerLower.includes("car")) {
            autoMapping[index.toString()] = "preferred_vehicle_type"
          } else if (headerLower.includes("birthday") || headerLower.includes("dob") || headerLower.includes("birth")) {
            autoMapping[index.toString()] = "birthday"
          } else if (headerLower.includes("note")) {
            autoMapping[index.toString()] = "notes"
          }
        })
        setColumnMapping(autoMapping)
        setStep("mapping")
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    // Validate that name is mapped
    const hasName = Object.values(columnMapping).includes("name")
    const hasContact = Object.values(columnMapping).includes("email") || Object.values(columnMapping).includes("phone")

    if (!hasName) {
      alert("Please map a column to Name (required)")
      return
    }
    if (!hasContact) {
      alert("Please map at least one contact method (Email or Phone)")
      return
    }

    setStep("importing")
    setImporting(true)

    const importBatchId = crypto.randomUUID()
    let success = 0
    let duplicates = 0
    let failed = 0

    for (const row of csvData) {
      const contact: Record<string, any> = {
        user_id: userId,
        import_source: "csv_import",
        import_batch_id: importBatchId,
        status: "active",
        sms_opted_in: true,
        email_opted_in: true,
      }

      // Map columns to fields
      Object.entries(columnMapping).forEach(([colIndex, field]) => {
        if (field && row[parseInt(colIndex)]) {
          let value = row[parseInt(colIndex)].trim()

          // Handle special fields
          if (field === "total_spend") {
            value = value.replace(/[$,]/g, "")
            contact[field] = parseFloat(value) || 0
          } else if (field === "rental_count") {
            contact[field] = parseInt(value) || 0
          } else if (field === "last_rental_date" || field === "birthday") {
            // Try to parse date
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
              contact[field] = date.toISOString().split("T")[0]
            }
          } else if (field === "phone") {
            // Normalize phone
            contact[field] = value.replace(/[^\d+]/g, "")
          } else if (field === "email") {
            contact[field] = value.toLowerCase()
          } else {
            contact[field] = value
          }
        }
      })

      // Skip if no name
      if (!contact.name) {
        failed++
        continue
      }

      // Check for duplicates
      if (contact.phone || contact.email) {
        let query = supabase
          .from("reactivation_contacts")
          .select("id")
          .eq("user_id", userId)

        if (contact.phone && contact.email) {
          query = query.or(`phone.eq.${contact.phone},email.eq.${contact.email}`)
        } else if (contact.phone) {
          query = query.eq("phone", contact.phone)
        } else {
          query = query.eq("email", contact.email)
        }

        const { data: existing } = await query.maybeSingle()
        if (existing) {
          duplicates++
          continue
        }
      }

      const { error } = await supabase.from("reactivation_contacts").insert(contact)
      if (error) {
        console.error("Import error:", error)
        failed++
      } else {
        success++
      }
    }

    setResults({ success, duplicates, failed })
    setStep("complete")
    setImporting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Import Contacts from CSV
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === "upload" && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive ? "border-[#375DEE] bg-[#375DEE]/10" : "border-white/20"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Drop your CSV file here</h3>
              <p className="text-white/50 mb-6">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-[#375DEE] rounded-lg text-white hover:bg-[#375DEE]/80 transition-colors"
              >
                Select CSV File
              </button>
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-6">
              <p className="text-white/50">
                Map your CSV columns to contact fields. Required: Name and at least one contact method (Email or Phone).
              </p>
              <div className="space-y-3">
                {headers.map((header, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1 px-4 py-2 bg-white/5 rounded-lg text-white/70 truncate">
                      {header}
                    </div>
                    <ChevronDown className="w-5 h-5 text-white/40" />
                    <select
                      value={columnMapping[index.toString()] || ""}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [index.toString()]: e.target.value })
                      }
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#375DEE]"
                    >
                      {fieldOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-white/50 mb-2">Preview ({csvData.length} rows)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {headers.map((h, i) => (
                          <th key={i} className="text-left p-2 text-white/50">
                            {columnMapping[i.toString()] || <span className="italic">Skip</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-white/5">
                          {row.map((cell, j) => (
                            <td key={j} className="p-2 text-white/70 truncate max-w-32">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-[#375DEE] border-t-transparent rounded-full mx-auto" />
              <p className="text-white/70 mt-6">Importing contacts...</p>
              <p className="text-white/50 text-sm mt-2">This may take a moment</p>
            </div>
          )}

          {step === "complete" && results && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-6">Import Complete</h3>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="bg-green-500/10 rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-400">{results.success}</p>
                  <p className="text-sm text-white/50">Imported</p>
                </div>
                <div className="bg-yellow-500/10 rounded-xl p-4">
                  <p className="text-2xl font-bold text-yellow-400">{results.duplicates}</p>
                  <p className="text-sm text-white/50">Duplicates</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4">
                  <p className="text-2xl font-bold text-red-400">{results.failed}</p>
                  <p className="text-sm text-white/50">Failed</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          {step === "upload" && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          {step === "mapping" && (
            <>
              <button
                onClick={() => setStep("upload")}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-2 bg-[#375DEE] rounded-lg text-white hover:bg-[#375DEE]/80 transition-colors"
              >
                Import {csvData.length} Contacts
              </button>
            </>
          )}
          {step === "complete" && (
            <button
              onClick={onSuccess}
              className="px-6 py-2 bg-[#375DEE] rounded-lg text-white hover:bg-[#375DEE]/80 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Add Contact Modal Component
function AddContactModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    last_rental_date: "",
    total_spend: "",
    preferred_vehicle_type: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      alert("Name is required")
      return
    }
    if (!formData.email && !formData.phone) {
      alert("At least one contact method (Email or Phone) is required")
      return
    }

    setSaving(true)
    const { error } = await supabase.from("reactivation_contacts").insert({
      user_id: userId,
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      last_rental_date: formData.last_rental_date || null,
      total_spend: formData.total_spend ? parseFloat(formData.total_spend) : 0,
      preferred_vehicle_type: formData.preferred_vehicle_type || null,
      notes: formData.notes || null,
      import_source: "manual",
      status: "active",
      sms_opted_in: !!formData.phone,
      email_opted_in: !!formData.email,
    })

    if (error) {
      console.error("Error adding contact:", error)
      alert("Failed to add contact")
    } else {
      onSuccess()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Add Contact
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/50 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#375DEE]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#375DEE]"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#375DEE]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-1">Last Rental Date</label>
              <input
                type="date"
                value={formData.last_rental_date}
                onChange={(e) => setFormData({ ...formData, last_rental_date: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#375DEE]"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1">Total Spend ($)</label>
              <input
                type="number"
                value={formData.total_spend}
                onChange={(e) => setFormData({ ...formData, total_spend: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#375DEE]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-1">Vehicle Preference</label>
            <input
              type="text"
              value={formData.preferred_vehicle_type}
              onChange={(e) => setFormData({ ...formData, preferred_vehicle_type: e.target.value })}
              placeholder="e.g., Lamborghini, Ferrari, SUV"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
            />
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#375DEE] resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#375DEE] rounded-lg text-white hover:bg-[#375DEE]/80 transition-colors disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Contact Detail Modal Component
function ContactDetailModal({
  contact,
  onClose,
  onUpdate,
}: {
  contact: Contact
  onClose: () => void
  onUpdate: () => void
}) {
  const supabase = createClient()

  const handleOptOut = async (channel: "sms" | "email") => {
    const field = channel === "sms" ? "sms_opted_in" : "email_opted_in"
    const { error } = await supabase
      .from("reactivation_contacts")
      .update({ [field]: false })
      .eq("id", contact.id)

    if (!error) {
      onUpdate()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Contact Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-2xl font-bold">{contact.name}</h3>
            <span
              className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[contact.status]
              }`}
            >
              {contact.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-white/40" />
                <div>
                  <p className="text-sm text-white/50">Email</p>
                  <p>{contact.email}</p>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-white/40" />
                <div>
                  <p className="text-sm text-white/50">Phone</p>
                  <p>{contact.phone}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <DollarSign className="w-5 h-5 text-[#375DEE] mb-2" />
              <p className="text-lg font-bold">${contact.total_spend?.toLocaleString() || "0"}</p>
              <p className="text-sm text-white/50">Total Spend</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <Car className="w-5 h-5 text-[#375DEE] mb-2" />
              <p className="text-lg font-bold">{contact.rental_count || 0}</p>
              <p className="text-sm text-white/50">Rentals</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-[#375DEE] mb-2" />
              <p className="text-lg font-bold">
                {contact.last_rental_date
                  ? new Date(contact.last_rental_date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "-"}
              </p>
              <p className="text-sm text-white/50">Last Rental</p>
            </div>
          </div>

          {contact.preferred_vehicle_type && (
            <div>
              <p className="text-sm text-white/50 mb-1">Vehicle Preference</p>
              <p>{contact.preferred_vehicle_type}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-white/50 mb-2">Communication Channels</p>
            <div className="flex gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  contact.sms_opted_in ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                <Phone className={`w-4 h-4 ${contact.sms_opted_in ? "text-green-400" : "text-red-400"}`} />
                <span className={contact.sms_opted_in ? "text-green-400" : "text-red-400"}>
                  SMS {contact.sms_opted_in ? "Enabled" : "Disabled"}
                </span>
                {contact.sms_opted_in && (
                  <button
                    onClick={() => handleOptOut("sms")}
                    className="ml-2 text-xs text-white/40 hover:text-white"
                  >
                    Opt out
                  </button>
                )}
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  contact.email_opted_in ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                <Mail className={`w-4 h-4 ${contact.email_opted_in ? "text-green-400" : "text-red-400"}`} />
                <span className={contact.email_opted_in ? "text-green-400" : "text-red-400"}>
                  Email {contact.email_opted_in ? "Enabled" : "Disabled"}
                </span>
                {contact.email_opted_in && (
                  <button
                    onClick={() => handleOptOut("email")}
                    className="ml-2 text-xs text-white/40 hover:text-white"
                  >
                    Opt out
                  </button>
                )}
              </div>
            </div>
          </div>

          {contact.tags && contact.tags.length > 0 && (
            <div>
              <p className="text-sm text-white/50 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-[#375DEE]/20 text-[#375DEE] rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
