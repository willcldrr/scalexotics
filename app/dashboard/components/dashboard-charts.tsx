"use client"

import { memo } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const COLORS = ["#375DEE", "#5b7cf2", "#8aa0f6", "#b8c4fa", "#ffffff", "#d1d5db", "#9ca3af", "#6b7280"]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-white/50 text-xs font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white/70 text-sm">{entry.name}:</span>
            <span className="text-white font-semibold text-sm">
              {typeof entry.value === 'number' && entry.name?.toLowerCase().includes('revenue')
                ? `$${entry.value.toLocaleString()}`
                : entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

interface RevenueChartProps {
  data: { date: string; revenue: number; bookings: number }[]
}

export const RevenueChart = memo(function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#375DEE" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#375DEE" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#ffffff20"
          tick={{ fill: '#ffffff40', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#ffffff20"
          tick={{ fill: '#ffffff40', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#375DEE"
          fill="url(#revenueGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
})

interface LeadSourcesPieChartProps {
  data: { name: string; value: number }[]
}

export const LeadSourcesPieChart = memo(function LeadSourcesPieChart({ data }: LeadSourcesPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={65}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
          style={{ cursor: 'default', outline: 'none' }}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} style={{ outline: 'none' }} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} cursor={false} />
      </PieChart>
    </ResponsiveContainer>
  )
})

interface VehiclePerformanceChartProps {
  data: { name: string; bookings: number; revenue: number }[]
}

export const VehiclePerformanceChart = memo(function VehiclePerformanceChart({ data }: VehiclePerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
        <XAxis
          type="number"
          stroke="#ffffff20"
          tick={{ fill: '#ffffff40', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#ffffff20"
          tick={{ fill: '#ffffff60', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Bar dataKey="revenue" name="Revenue" fill="#375DEE" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
})

interface BookingStatusPieChartProps {
  data: { name: string; value: number }[]
}

export const BookingStatusPieChart = memo(function BookingStatusPieChart({ data }: BookingStatusPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={65}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
          style={{ cursor: 'default', outline: 'none' }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              style={{ outline: 'none' }}
              fill={
                entry.name.toLowerCase() === "completed" ? "#ffffff" :
                entry.name.toLowerCase() === "confirmed" ? "#375DEE" :
                entry.name.toLowerCase() === "pending" ? "#8aa0f6" :
                entry.name.toLowerCase() === "cancelled" ? "#4b5563" :
                "#6b7280"
              }
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} cursor={false} />
      </PieChart>
    </ResponsiveContainer>
  )
})

export { COLORS }
