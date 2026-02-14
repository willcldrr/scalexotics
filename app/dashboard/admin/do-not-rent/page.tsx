"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Upload,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Check,
  Loader2,
  Shield,
  Calendar,
  MapPin,
  User,
  Edit,
} from "lucide-react"
import { format } from "date-fns"

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

interface CSVRow {
  id?: string
  full_name?: string
  date_of_birth?: string
  expiration_date?: string
  issuing_state?: string
  [key: string]: string | undefined
}

export default function DoNotRentPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [entries, setEntries] = useState<DoNotRentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // CSV Import state
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null)

  // Add/Edit modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DoNotRentEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    expiration_date: "",
    issuing_state: "",
    id_number: "",
    phone: "",
    email: "",
    reason: "",
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("do_not_rent_list")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setEntries(data)
    }
    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim())
    if (lines.length < 2) return

    // Parse headers
    const headers = lines[0].split("\t").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"))
    setCsvHeaders(headers)

    // Parse rows
    const rows: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split("\t")
      const row: CSVRow = {}
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || ""
      })
      if (row.full_name) {
        rows.push(row)
      }
    }
    setCsvData(rows)
    setShowImportModal(true)
    setImportResult(null)
  }

  const handleImport = async () => {
    setImporting(true)
    let success = 0
    let errors = 0

    const { data: { user } } = await supabase.auth.getUser()

    for (const row of csvData) {
      // Parse dates - handle various formats
      let dob = null
      let expDate = null

      if (row.date_of_birth) {
        const parsed = new Date(row.date_of_birth)
        if (!isNaN(parsed.getTime())) {
          dob = parsed.toISOString().split("T")[0]
        }
      }

      if (row.expiration_date) {
        const parsed = new Date(row.expiration_date)
        if (!isNaN(parsed.getTime())) {
          expDate = parsed.toISOString().split("T")[0]
        }
      }

      const { error } = await supabase.from("do_not_rent_list").insert({
        full_name: row.full_name,
        date_of_birth: dob,
        expiration_date: expDate,
        issuing_state: row.issuing_state || null,
        id_number: row.id || null,
        added_by: user?.id,
      })

      if (error) {
        errors++
      } else {
        success++
      }
    }

    setImportResult({ success, errors })
    setImporting(false)
    fetchEntries()
  }

  const handleSave = async () => {
    if (!formData.full_name.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const entryData = {
      full_name: formData.full_name.trim(),
      date_of_birth: formData.date_of_birth || null,
      expiration_date: formData.expiration_date || null,
      issuing_state: formData.issuing_state || null,
      id_number: formData.id_number || null,
      phone: formData.phone || null,
      email: formData.email || null,
      reason: formData.reason || null,
      added_by: user?.id,
    }

    if (editingEntry) {
      await supabase
        .from("do_not_rent_list")
        .update(entryData)
        .eq("id", editingEntry.id)
    } else {
      await supabase.from("do_not_rent_list").insert(entryData)
    }

    setSaving(false)
    setShowAddModal(false)
    setEditingEntry(null)
    resetForm()
    fetchEntries()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this person from the Do Not Rent list?")) return

    await supabase.from("do_not_rent_list").delete().eq("id", id)
    fetchEntries()
  }

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear the ENTIRE Do Not Rent list? This cannot be undone.")) return
    if (!confirm("This will delete ALL entries. Are you absolutely sure?")) return

    await supabase.from("do_not_rent_list").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    fetchEntries()
  }

  const resetForm = () => {
    setFormData({
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

  const openEditModal = (entry: DoNotRentEntry) => {
    setEditingEntry(entry)
    setFormData({
      full_name: entry.full_name,
      date_of_birth: entry.date_of_birth || "",
      expiration_date: entry.expiration_date || "",
      issuing_state: entry.issuing_state || "",
      id_number: entry.id_number || "",
      phone: entry.phone || "",
      email: entry.email || "",
      reason: entry.reason || "",
    })
    setShowAddModal(true)
  }

  const filteredEntries = entries.filter(entry =>
    entry.full_name.toLowerCase().includes(search.toLowerCase()) ||
    entry.issuing_state?.toLowerCase().includes(search.toLowerCase()) ||
    entry.id_number?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-sm text-white/50">Total Entries</p>
            <p className="text-2xl font-bold">{entries.length}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.tsv,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => {
              resetForm()
              setEditingEntry(null)
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, state, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/40 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Entries list */}
      <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center">
            <AlertTriangle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {entries.length === 0 ? "No entries yet" : "No matches found"}
            </h3>
            <p className="text-white/50 text-sm mb-6">
              {entries.length === 0
                ? "Upload a CSV or add entries manually to build your Do Not Rent list"
                : "Try adjusting your search"}
            </p>
            {entries.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
              >
                <Upload className="w-5 h-5" />
                Import CSV
              </button>
            )}
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
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/50">Expires</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/50">Reason</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-white/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredEntries.map((entry) => (
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
                      {entry.date_of_birth
                        ? format(new Date(entry.date_of_birth), "MMM d, yyyy")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-white/60 font-mono text-sm">
                      {entry.id_number || "—"}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {entry.issuing_state || "—"}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {entry.expiration_date
                        ? format(new Date(entry.expiration_date), "MMM d, yyyy")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-white/60 max-w-[200px] truncate">
                      {entry.reason || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
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

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] rounded-2xl border border-white/[0.08] w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-[#375DEE]" />
                <h2 className="text-lg font-bold">Import CSV</h2>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setCsvData([])
                  setCsvHeaders([])
                  setImportResult(null)
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
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
                    onClick={() => {
                      setShowImportModal(false)
                      setCsvData([])
                      setCsvHeaders([])
                      setImportResult(null)
                    }}
                    className="px-6 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-white/60 mb-4">
                    Found <span className="text-white font-semibold">{csvData.length}</span> entries to import.
                    Preview:
                  </p>

                  <div className="bg-black/50 rounded-xl border border-white/[0.08] overflow-hidden mb-6">
                    <div className="overflow-x-auto max-h-[300px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-black">
                          <tr className="border-b border-white/[0.08]">
                            <th className="text-left px-4 py-3 text-white/50">Name</th>
                            <th className="text-left px-4 py-3 text-white/50">DOB</th>
                            <th className="text-left px-4 py-3 text-white/50">State</th>
                            <th className="text-left px-4 py-3 text-white/50">ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {csvData.slice(0, 10).map((row, i) => (
                            <tr key={i}>
                              <td className="px-4 py-3 text-white">{row.full_name}</td>
                              <td className="px-4 py-3 text-white/60">{row.date_of_birth || "—"}</td>
                              <td className="px-4 py-3 text-white/60">{row.issuing_state || "—"}</td>
                              <td className="px-4 py-3 text-white/60 font-mono">{row.id || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvData.length > 10 && (
                      <p className="text-center text-white/40 text-sm py-3 border-t border-white/[0.08]">
                        ...and {csvData.length - 10} more
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowImportModal(false)
                        setCsvData([])
                        setCsvHeaders([])
                      }}
                      className="flex-1 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Import {csvData.length} Entries
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] rounded-2xl border border-white/[0.08] w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <h2 className="text-lg font-bold">
                {editingEntry ? "Edit Entry" : "Add to Do Not Rent List"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingEntry(null)
                  resetForm()
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">ID Expiration</label>
                  <input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">ID Number</label>
                  <input
                    type="text"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                    placeholder="DL12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Issuing State</label>
                  <input
                    type="text"
                    value={formData.issuing_state}
                    onChange={(e) => setFormData({ ...formData, issuing_state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                    placeholder="CA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                    placeholder="john@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Reason for Ban</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                  placeholder="Describe why this person is banned..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingEntry(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.full_name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>{editingEntry ? "Save Changes" : "Add to List"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
