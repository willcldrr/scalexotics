"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Upload,
  Search,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Car,
  UserPlus,
  FileSpreadsheet,
  X,
  Check,
  ChevronDown,
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-[#375DEE]/15 text-[#375DEE] border border-[#375DEE]/20",
      paused: "bg-white/[0.08] text-white/70 border border-white/10",
      opted_out: "bg-white/[0.04] text-white/40 border border-white/[0.06]",
      converted: "bg-white/10 text-white border border-white/15",
      invalid: "bg-white/[0.04] text-white/30 border border-white/[0.04]",
    }
    return colors[status] || colors.active
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Contacts", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "SMS Opted In", value: stats.smsOptedIn },
          { label: "Email Opted In", value: stats.emailOptedIn },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
            <p className="text-white/50 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#375DEE]/50 transition-colors"
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
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white/70 text-sm hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Contact
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-lg text-[#375DEE] text-sm hover:bg-[#375DEE]/25 transition-all"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#375DEE] border-t-transparent rounded-full mx-auto" />
            <p className="text-white/40 mt-4 text-sm">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-white/40 text-sm">No contacts yet</p>
            <p className="text-white/25 text-xs mt-1 mb-4">Import your past customers via CSV</p>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-lg text-[#375DEE] text-sm hover:bg-[#375DEE]/25 transition-all"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Contact</th>
                  <th className="text-left px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Last Rental</th>
                  <th className="text-left px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Total Spend</th>
                  <th className="text-left px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Channels</th>
                  <th className="text-left px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#375DEE]/20 to-[#375DEE]/10 flex items-center justify-center border border-white/[0.08]">
                          <span className="text-sm font-semibold text-white/80">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{contact.name}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
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
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-white/60">
                      {contact.last_rental_date
                        ? new Date(contact.last_rental_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-white/60">
                      ${contact.total_spend?.toLocaleString() || "0"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {contact.sms_opted_in && (
                          <span className="px-2 py-0.5 bg-[#375DEE]/10 text-[#375DEE] rounded text-[10px] font-medium">
                            SMS
                          </span>
                        )}
                        {contact.email_opted_in && (
                          <span className="px-2 py-0.5 bg-white/[0.06] text-white/60 rounded text-[10px] font-medium">
                            Email
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setSelectedContact(contact)}
                        className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-white/40" />
                      </button>
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
  const [step, setStep] = useState<"upload" | "mapping" | "importing" | "complete">("upload")
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

      Object.entries(columnMapping).forEach(([colIndex, field]) => {
        if (field && row[parseInt(colIndex)]) {
          let value = row[parseInt(colIndex)].trim()
          if (field === "total_spend") {
            value = value.replace(/[$,]/g, "")
            contact[field] = parseFloat(value) || 0
          } else if (field === "rental_count") {
            contact[field] = parseInt(value) || 0
          } else if (field === "last_rental_date" || field === "birthday") {
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
              contact[field] = date.toISOString().split("T")[0]
            }
          } else if (field === "phone") {
            contact[field] = value.replace(/[^\d+]/g, "")
          } else if (field === "email") {
            contact[field] = value.toLowerCase()
          } else {
            contact[field] = value
          }
        }
      })

      if (!contact.name) {
        failed++
        continue
      }

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
      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-bold">
            Import Contacts from CSV
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === "upload" && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive ? "border-[#375DEE] bg-[#375DEE]/5" : "border-white/[0.08]"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="font-bold mb-1">Drop your CSV file here</h3>
              <p className="text-white/40 text-sm mb-6">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-lg text-[#375DEE] text-sm hover:bg-[#375DEE]/25 transition-all"
              >
                Select CSV File
              </button>
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-6">
              <p className="text-white/50 text-sm">
                Map your CSV columns to contact fields. Required: Name and at least one contact method.
              </p>
              <div className="space-y-3">
                {headers.map((header, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1 px-3 py-2 bg-white/[0.03] rounded-lg text-white/60 text-sm truncate">
                      {header}
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/30" />
                    <select
                      value={columnMapping[index.toString()] || ""}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [index.toString()]: e.target.value })
                      }
                      className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#375DEE]/50"
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
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <p className="text-xs text-white/40 mb-3">Preview ({csvData.length} rows)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {headers.map((h, i) => (
                          <th key={i} className="text-left p-2 text-white/40">
                            {columnMapping[i.toString()] || <span className="italic text-white/20">Skip</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-white/[0.04]">
                          {row.map((cell, j) => (
                            <td key={j} className="p-2 text-white/60 truncate max-w-32">
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
              <div className="animate-spin w-10 h-10 border-2 border-[#375DEE] border-t-transparent rounded-full mx-auto" />
              <p className="text-white/60 mt-6 text-sm">Importing contacts...</p>
            </div>
          )}

          {step === "complete" && results && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-[#375DEE]/15 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-7 h-7 text-[#375DEE]" />
              </div>
              <h3 className="text-lg font-bold mb-6">Import Complete</h3>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                <div className="bg-[#375DEE]/10 rounded-xl p-4">
                  <p className="text-2xl font-bold text-[#375DEE]">{results.success}</p>
                  <p className="text-xs text-white/50">Imported</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-4">
                  <p className="text-2xl font-bold text-white/60">{results.duplicates}</p>
                  <p className="text-xs text-white/50">Duplicates</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-4">
                  <p className="text-2xl font-bold text-white/40">{results.failed}</p>
                  <p className="text-xs text-white/50">Failed</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
          {step === "upload" && (
            <button onClick={onClose} className="px-4 py-2 text-white/50 text-sm hover:text-white transition-colors">
              Cancel
            </button>
          )}
          {step === "mapping" && (
            <>
              <button onClick={() => setStep("upload")} className="px-4 py-2 text-white/50 text-sm hover:text-white transition-colors">
                Back
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-lg text-[#375DEE] text-sm hover:bg-[#375DEE]/25 transition-all"
              >
                Import {csvData.length} Contacts
              </button>
            </>
          )}
          {step === "complete" && (
            <button
              onClick={onSuccess}
              className="px-4 py-2 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-lg text-[#375DEE] text-sm hover:bg-[#375DEE]/25 transition-all"
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
      alert("At least one contact method is required")
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
      alert("Failed to add contact")
    } else {
      onSuccess()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-bold">
            Add Contact
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#375DEE]/50"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#375DEE]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#375DEE]/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Last Rental Date</label>
              <input
                type="date"
                value={formData.last_rental_date}
                onChange={(e) => setFormData({ ...formData, last_rental_date: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#375DEE]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Total Spend ($)</label>
              <input
                type="number"
                value={formData.total_spend}
                onChange={(e) => setFormData({ ...formData, total_spend: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#375DEE]/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Vehicle Preference</label>
            <input
              type="text"
              value={formData.preferred_vehicle_type}
              onChange={(e) => setFormData({ ...formData, preferred_vehicle_type: e.target.value })}
              placeholder="e.g., Lamborghini, Ferrari"
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#375DEE]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#375DEE]/50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-white/50 text-sm hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-lg text-[#375DEE] text-sm hover:bg-[#375DEE]/25 transition-all disabled:opacity-50"
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-[#375DEE]/15 text-[#375DEE] border border-[#375DEE]/20",
      paused: "bg-white/[0.08] text-white/70 border border-white/10",
      opted_out: "bg-white/[0.04] text-white/40 border border-white/[0.06]",
      converted: "bg-white/10 text-white border border-white/15",
      invalid: "bg-white/[0.04] text-white/30 border border-white/[0.04]",
    }
    return colors[status] || colors.active
  }

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
      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-bold">
            Contact Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold">{contact.name}</h3>
            <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide ${getStatusColor(contact.status)}`}>
              {contact.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-white/30" />
                <div>
                  <p className="text-xs text-white/40">Email</p>
                  <p className="text-sm">{contact.email}</p>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-white/30" />
                <div>
                  <p className="text-xs text-white/40">Phone</p>
                  <p className="text-sm">{contact.phone}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-3">
              <DollarSign className="w-4 h-4 text-[#375DEE] mb-1" />
              <p className="font-semibold">${contact.total_spend?.toLocaleString() || "0"}</p>
              <p className="text-xs text-white/40">Total Spend</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-3">
              <Car className="w-4 h-4 text-[#375DEE] mb-1" />
              <p className="font-semibold">{contact.rental_count || 0}</p>
              <p className="text-xs text-white/40">Rentals</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-3">
              <Calendar className="w-4 h-4 text-[#375DEE] mb-1" />
              <p className="font-semibold text-sm">
                {contact.last_rental_date
                  ? new Date(contact.last_rental_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                  : "-"}
              </p>
              <p className="text-xs text-white/40">Last Rental</p>
            </div>
          </div>

          {contact.preferred_vehicle_type && (
            <div>
              <p className="text-xs text-white/40 mb-1">Vehicle Preference</p>
              <p className="text-sm">{contact.preferred_vehicle_type}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-white/40 mb-2">Communication Channels</p>
            <div className="flex gap-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${contact.sms_opted_in ? "bg-[#375DEE]/10" : "bg-white/[0.03]"}`}>
                <Phone className={`w-4 h-4 ${contact.sms_opted_in ? "text-[#375DEE]" : "text-white/30"}`} />
                <span className={`text-sm ${contact.sms_opted_in ? "text-[#375DEE]" : "text-white/40"}`}>
                  SMS {contact.sms_opted_in ? "On" : "Off"}
                </span>
                {contact.sms_opted_in && (
                  <button onClick={() => handleOptOut("sms")} className="ml-1 text-xs text-white/30 hover:text-white/50">
                    Opt out
                  </button>
                )}
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${contact.email_opted_in ? "bg-[#375DEE]/10" : "bg-white/[0.03]"}`}>
                <Mail className={`w-4 h-4 ${contact.email_opted_in ? "text-[#375DEE]" : "text-white/30"}`} />
                <span className={`text-sm ${contact.email_opted_in ? "text-[#375DEE]" : "text-white/40"}`}>
                  Email {contact.email_opted_in ? "On" : "Off"}
                </span>
                {contact.email_opted_in && (
                  <button onClick={() => handleOptOut("email")} className="ml-1 text-xs text-white/30 hover:text-white/50">
                    Opt out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 text-white/50 text-sm hover:text-white transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
