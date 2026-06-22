export const dynamic = 'force-dynamic'

import { RevenueChart } from '@/components/admin/revenue-chart'
import { prisma } from '@/lib/db/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminRevenuePage() {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    return { start: startOfMonth(d), end: endOfMonth(d), label: d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }) }
  })

  const data = await Promise.all(
    months.map(async ({ start, end, label }) => {
      const result = await prisma.booking.aggregate({
        _sum: { price: true },
        _count: { id: true },
        where: { status: { in: ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] }, scheduledAt: { gte: start, lte: end } },
      })
      return { month: label, revenue: Number(result._sum.price ?? 0), bookings: result._count.id }
    }),
  )

  const totalRevenue = data.reduce((s, m) => s + m.revenue, 0)
  const avgMonthly = totalRevenue / data.length
  const projected = Math.round(avgMonthly * 12)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatório de Receita</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Receita total (6 meses)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Média mensal</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${avgMonthly.toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Projeção anual</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">${projected.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Receita mensal (últimos 6 meses)</CardTitle></CardHeader>
        <CardContent>
          <RevenueChart data={data} />
        </CardContent>
      </Card>
    </div>
  )
}
