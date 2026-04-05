"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { format, subDays, startOfMonth } from "date-fns"
import {
  BarChart3,
  Download,
  FileText,
  DollarSign,
  CalendarDays,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type DataType = "bookings" | "revenue" | "leads"

interface AnalyticsResponse {
  data: Record<string, unknown>[]
  summary: Record<string, unknown>
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/50 uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white/70" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [dataType, setDataType] = useState<DataType>("bookings")
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        type: dataType,
        from: fromDate,
        to: toDate,
        format: "json",
      })

      const res = await fetch(`/api/analytics?${params}`)
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to fetch analytics data")
      }

      const result: AnalyticsResponse = await res.json()
      setAnalyticsData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setAnalyticsData(null)
    } finally {
      setLoading(false)
    }
  }, [dataType, fromDate, toDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async (exportFormat: "csv" | "pdf") => {
    setExporting(exportFormat)
    try {
      const params = new URLSearchParams({
        type: dataType,
        from: fromDate,
        to: toDate,
        format: exportFormat,
      })

      const res = await fetch(`/api/analytics?${params}`)
      if (!res.ok) {
        throw new Error("Export failed")
      }

      if (exportFormat === "csv") {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${dataType}_report_${fromDate}_${toDate}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // PDF: open HTML report in new tab for printing
        const html = await res.text()
        const newWindow = window.open("", "_blank")
        if (newWindow) {
          newWindow.document.write(html)
          newWindow.document.close()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed")
    } finally {
      setExporting(null)
    }
  }

  const setQuickRange = (days: number) => {
    setToDate(format(new Date(), "yyyy-MM-dd"))
    setFromDate(format(subDays(new Date(), days), "yyyy-MM-dd"))
  }

  const summary = analyticsData?.summary || {}
  const data = analyticsData?.data || []
  const columns = data.length > 0 ? Object.keys(data[0]) : []

  // Build summary cards based on data type
  const summaryCards = []
  if (dataType === "bookings") {
    summaryCards.push(
      { label: "Total Bookings", value: String(summary.total_bookings ?? 0), icon: CalendarDays },
      { label: "Confirmed", value: String(summary.confirmed_bookings ?? 0), icon: TrendingUp },
      { label: "Total Revenue", value: `$${Number(summary.total_revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign },
      { label: "Avg Booking Value", value: `$${Number(summary.avg_booking_value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: BarChart3 },
    )
  } else if (dataType === "revenue") {
    summaryCards.push(
      { label: "Total Revenue", value: `$${Number(summary.total_revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign },
      { label: "Total Bookings", value: String(summary.total_bookings ?? 0), icon: CalendarDays },
      { label: "Avg Booking Value", value: `$${Number(summary.avg_booking_value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: BarChart3 },
    )
  } else if (dataType === "leads") {
    summaryCards.push(
      { label: "Total Leads", value: String(summary.total_leads ?? 0), icon: Users },
      { label: "Booked", value: String(summary.booked ?? 0), icon: CalendarDays },
      { label: "Conversion Rate", value: `${summary.conversion_rate ?? 0}%`, icon: TrendingUp },
    )
  }

  const formatCellValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return "-"
    if (key === "deposit_amount" || key === "total_amount") {
      return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    }
    if (key === "created_at" || key === "start_date" || key === "end_date") {
      try {
        return format(new Date(String(value)), "MMM d, yyyy")
      } catch {
        return String(value)
      }
    }
    if (key === "deposit_paid") return value ? "Yes" : "No"
    return String(value)
  }

  const formatColumnHeader = (key: string): string => {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-sm text-white/50 mt-1">View and export your business data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            disabled={exporting !== null || data.length === 0}
            className="border-white/10 text-white hover:bg-white/5"
          >
            {exporting === "csv" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="ml-1.5">CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null || data.length === 0}
            className="border-white/10 text-white hover:bg-white/5"
          >
            {exporting === "pdf" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="ml-1.5">PDF</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {/* Data type */}
          <div className="w-full sm:w-48">
            <Label className="text-white/70 mb-1.5">Report Type</Label>
            <Select value={dataType} onValueChange={(v) => setDataType(v as DataType)}>
              <SelectTrigger className="bg-black border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="leads">Leads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From date */}
          <div className="w-full sm:w-44">
            <Label className="text-white/70 mb-1.5">From</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-black border-white/10 text-white [color-scheme:dark]"
            />
          </div>

          {/* To date */}
          <div className="w-full sm:w-44">
            <Label className="text-white/70 mb-1.5">To</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-black border-white/10 text-white [color-scheme:dark]"
            />
          </div>

          {/* Quick ranges */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(7)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              7d
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(30)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              30d
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(90)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              90d
            </Button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Data table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            {dataType.charAt(0).toUpperCase() + dataType.slice(1)} Data
          </h3>
          {!loading && (
            <span className="text-sm text-white/40">{data.length} records</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-400 text-sm">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <BarChart3 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No data found for the selected date range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  {columns
                    .filter((col) => col !== "id")
                    .map((col) => (
                      <TableHead key={col} className="text-white/50 text-xs uppercase tracking-wider">
                        {formatColumnHeader(col)}
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-white/5">
                    {columns
                      .filter((col) => col !== "id")
                      .map((col) => (
                        <TableCell key={col} className="text-white/80 text-sm">
                          {formatCellValue(col, row[col])}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
