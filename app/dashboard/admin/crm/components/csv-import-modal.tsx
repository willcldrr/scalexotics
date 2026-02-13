"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  X,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react"

interface CSVImportModalProps {
  onClose: () => void
  onImport: (count: number) => void
}

const fieldOptions = [
  { value: "", label: "Skip" },
  { value: "company_name", label: "Company Name *" },
  { value: "contact_name", label: "Contact Name *" },
  { value: "contact_email", label: "Contact Email" },
  { value: "contact_phone", label: "Contact Phone" },
  { value: "contact_title", label: "Contact Title" },
  { value: "website", label: "Website" },
  { value: "location", label: "Location" },
  { value: "fleet_size", label: "Fleet Size" },
  { value: "source", label: "Lead Source" },
  { value: "estimated_value", label: "Estimated Value" },
  { value: "notes", label: "Notes" },
]

export default function CSVImportModal({ onClose, onImport }: CSVImportModalProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  const parseCSV = (text: string): { headers: string[]; data: Array<Record<string, string>> } => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length === 0) return { headers: [], data: [] }

    const headers = parseCSVLine(lines[0])
    const data = lines
      .slice(1)
      .map((line) => {
        const values = parseCSVLine(line)
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ""
        })
        return row
      })
      .filter((row) => Object.values(row).some((v) => v.trim()))

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

      // Auto-map columns
      const autoMapping: Record<string, string> = {}
      const mappings: Record<string, string[]> = {
        company_name: ["company", "company name", "business", "business name", "organization"],
        contact_name: ["name", "contact", "contact name", "full name", "person"],
        contact_email: ["email", "e-mail", "mail", "contact email"],
        contact_phone: ["phone", "telephone", "tel", "mobile", "cell", "contact phone"],
        contact_title: ["title", "position", "role", "job title"],
        website: ["website", "url", "web", "site"],
        location: ["location", "city", "address", "region", "state"],
        fleet_size: ["fleet", "fleet size", "vehicles", "cars", "size"],
        source: ["source", "lead source", "channel", "origin"],
        estimated_value: ["value", "deal value", "estimated value", "amount", "revenue"],
        notes: ["notes", "note", "comments", "description"],
      }

      headers.forEach((header) => {
        const lowerHeader = header.toLowerCase().trim()
        for (const [field, variants] of Object.entries(mappings)) {
          if (variants.some((v) => lowerHeader === v || lowerHeader.includes(v))) {
            autoMapping[header] = field
            break
          }
        }
      })

      setColumnMapping(autoMapping)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (csvData.length === 0) return
    setImporting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setImporting(false)
      return
    }

    let success = 0
    let failed = 0

    // Get mapped columns
    const getColumn = (field: string) => {
      return Object.entries(columnMapping).find(([_, v]) => v === field)?.[0]
    }

    const companyCol = getColumn("company_name")
    const contactCol = getColumn("contact_name")
    const emailCol = getColumn("contact_email")
    const phoneCol = getColumn("contact_phone")
    const titleCol = getColumn("contact_title")
    const websiteCol = getColumn("website")
    const locationCol = getColumn("location")
    const fleetCol = getColumn("fleet_size")
    const sourceCol = getColumn("source")
    const valueCol = getColumn("estimated_value")
    const notesCol = getColumn("notes")

    if (!companyCol || !contactCol) {
      alert("Please map at least Company Name and Contact Name columns")
      setImporting(false)
      return
    }

    // Prepare all lead data for batch insert
    const leadsToInsert: Array<Record<string, any>> = []
    const notesData: Array<{ rowIndex: number; content: string }> = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      const companyName = row[companyCol]?.trim()
      const contactName = row[contactCol]?.trim()

      if (!companyName || !contactName) {
        failed++
        continue
      }

      const leadData: Record<string, any> = {
        user_id: user.id,
        company_name: companyName,
        contact_name: contactName,
        status: "not_contacted",
      }

      if (emailCol) leadData.contact_email = row[emailCol]?.trim() || null
      if (phoneCol) leadData.contact_phone = row[phoneCol]?.trim() || null
      if (titleCol) leadData.contact_title = row[titleCol]?.trim() || null
      if (websiteCol) leadData.website = row[websiteCol]?.trim() || null
      if (locationCol) leadData.location = row[locationCol]?.trim() || null
      if (sourceCol) leadData.source = row[sourceCol]?.trim() || null
      if (fleetCol) {
        const fleet = parseInt(row[fleetCol]?.trim())
        if (!isNaN(fleet)) leadData.fleet_size = fleet
      }
      if (valueCol) {
        const value = parseFloat(row[valueCol]?.trim().replace(/[$,]/g, ""))
        if (!isNaN(value)) leadData.estimated_value = value
      }

      // Track notes to add after batch insert
      const noteContent = notesCol ? row[notesCol]?.trim() : null
      if (noteContent) {
        notesData.push({ rowIndex: leadsToInsert.length, content: noteContent })
      }

      leadsToInsert.push(leadData)
    }

    // Batch insert in chunks of 500 (Supabase limit is ~1000)
    const BATCH_SIZE = 500
    const insertedLeads: Array<{ id: string }> = []
    const totalBatches = Math.ceil(leadsToInsert.length / BATCH_SIZE)

    setImportProgress({ current: 0, total: leadsToInsert.length })

    for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
      const batch = leadsToInsert.slice(i, i + BATCH_SIZE)

      const { data: batchResult, error } = await supabase
        .from("crm_leads")
        .insert(batch)
        .select("id")

      if (error) {
        console.error("Batch insert error:", error)
        failed += batch.length
      } else if (batchResult) {
        success += batchResult.length
        insertedLeads.push(...batchResult)
      }

      // Update progress
      setImportProgress({ current: Math.min(i + BATCH_SIZE, leadsToInsert.length), total: leadsToInsert.length })
    }

    // Add notes for leads that had notes (in batches)
    if (notesData.length > 0 && insertedLeads.length > 0) {
      const notesToInsert = notesData
        .filter(n => insertedLeads[n.rowIndex])
        .map(n => ({
          lead_id: insertedLeads[n.rowIndex].id,
          user_id: user.id,
          content: n.content,
          note_type: "note",
        }))

      if (notesToInsert.length > 0) {
        for (let i = 0; i < notesToInsert.length; i += BATCH_SIZE) {
          const batch = notesToInsert.slice(i, i + BATCH_SIZE)
          await supabase.from("crm_notes").insert(batch)
        }
      }
    }

    setImportResult({ success, failed })
    setImporting(false)

    if (success > 0) {
      setTimeout(() => {
        onImport(success)
        onClose()
      }, 2000)
    }
  }

  const resetModal = () => {
    setCsvData([])
    setCsvHeaders([])
    setColumnMapping({})
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-[#375DEE]" />
            <h2 className="text-xl font-bold">Import Leads from CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {csvData.length === 0 ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-[#375DEE]/50 transition-colors"
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
                  Company Name, Contact Name, Email, Phone, Location, Fleet Size
                  <br />
                  Miami Exotics, John Smith, john@example.com, 555-123-4567, Miami FL, 15
                </code>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {importResult && (
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl ${
                    importResult.failed === 0
                      ? "bg-[#375DEE]/10 border border-[#375DEE]/30 text-[#375DEE]"
                      : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                  }`}
                >
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
                  {csvHeaders.map((header) => (
                    <div key={header} className="flex items-center gap-3">
                      <span
                        className="text-sm text-white/50 w-32 truncate"
                        title={header}
                      >
                        {header}
                      </span>
                      <select
                        value={columnMapping[header] || ""}
                        onChange={(e) =>
                          setColumnMapping({
                            ...columnMapping,
                            [header]: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#375DEE]"
                      >
                        {fieldOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
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
                          {csvHeaders.slice(0, 5).map((header) => (
                            <th
                              key={header}
                              className="px-4 py-2 text-left text-white/60 font-medium"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-white/5">
                            {csvHeaders.slice(0, 5).map((header) => (
                              <td
                                key={header}
                                className="px-4 py-2 text-white/80 truncate max-w-[150px]"
                              >
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

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          {csvData.length > 0 && !importResult && (
            <button
              onClick={resetModal}
              className="px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
            >
              Choose Different File
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
          >
            {importResult ? "Close" : "Cancel"}
          </button>
          {csvData.length > 0 && !importResult && (
            <button
              onClick={handleImport}
              disabled={
                importing ||
                !Object.values(columnMapping).includes("company_name") ||
                !Object.values(columnMapping).includes("contact_name")
              }
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 font-semibold transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {importProgress.total > 0
                    ? `Importing... ${importProgress.current} / ${importProgress.total}`
                    : "Preparing..."}
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
  )
}
