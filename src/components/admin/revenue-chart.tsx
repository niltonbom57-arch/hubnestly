'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

interface MonthData {
  month: string
  revenue: number
  bookings: number
}

interface RevenueChartProps {
  data: MonthData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const avg = data.reduce((s, d) => s + d.revenue, 0) / data.length

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v}`} />
        <Tooltip
          formatter={(value) => typeof value === 'number' ? [`$${value.toFixed(2)}`, 'Receita'] : [String(value), 'Receita']}
          labelStyle={{ fontWeight: 600 }}
        />
        <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Receita" />
        <ReferenceLine y={avg} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: 'Média', position: 'insideTopRight', fontSize: 11 }} />
      </BarChart>
    </ResponsiveContainer>
  )
}
