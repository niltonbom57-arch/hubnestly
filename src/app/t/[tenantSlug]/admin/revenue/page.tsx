export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import {
  DollarSign, TrendingUp, TrendingDown, Target,
  BarChart3, Sparkles, ArrowUp, ArrowDown,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  params: { tenantSlug: string }
}

interface MonthMeta {
  year: number
  month: number
  label: string
}

interface MonthStats {
  label: string
  revenue: number
  count: number
  avgTicket: number
  vsPercent: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function pct(v: number) {
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

function buildMonths(now: Date): MonthMeta[] {
  const year = now.getFullYear()
  const month = now.getMonth()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(year, month - 6 + i, 1)
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    }
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RevenuePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as { tenantId?: string; role?: string } | undefined

  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant) notFound()

  if (sessionUser?.tenantId !== tenant.id || sessionUser?.role !== 'ADMIN') {
    notFound()
  }

  // ── Buscar bookings dos últimos 6 meses + mês atual ─────────────────────────
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const dayOfMonth = now.getDate()

  const windowStart = new Date(currentYear, currentMonth - 6, 1)

  const bookings = await prisma.booking.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS'] },
      scheduledAt: { gte: windowStart },
    },
    select: { price: true, scheduledAt: true, userId: true },
  })

  const months = buildMonths(now)

  // ── Agregar por mês ──────────────────────────────────────────────────────────
  const monthlyMap = new Map<string, { revenue: number; count: number }>()
  for (const m of months) {
    monthlyMap.set(`${m.year}-${m.month}`, { revenue: 0, count: 0 })
  }

  for (const b of bookings) {
    const d = new Date(b.scheduledAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const slot = monthlyMap.get(key)
    if (slot) {
      slot.revenue += Number(b.price)
      slot.count += 1
    }
  }

  // ── Construir stats ──────────────────────────────────────────────────────────
  const monthStats: MonthStats[] = months.map((m, i) => {
    const key = `${m.year}-${m.month}`
    const curr = monthlyMap.get(key) ?? { revenue: 0, count: 0 }
    const avgTicket = curr.count > 0 ? curr.revenue / curr.count : 0

    let vsPercent: number | null = null
    if (i > 0) {
      const prevKey = `${months[i - 1]?.year}-${months[i - 1]?.month}`
      const prev = monthlyMap.get(prevKey) ?? { revenue: 0, count: 0 }
      if (prev.revenue > 0) {
        vsPercent = ((curr.revenue - prev.revenue) / prev.revenue) * 100
      } else if (curr.revenue > 0) {
        vsPercent = 100
      }
    }

    return { label: m.label, revenue: curr.revenue, count: curr.count, avgTicket, vsPercent }
  })

  // ── Métricas principais ──────────────────────────────────────────────────────
  const currentKey = `${currentYear}-${currentMonth}`
  const currentData = monthlyMap.get(currentKey) ?? { revenue: 0, count: 0 }

  const prevMonthKey = `${months[5]?.year}-${months[5]?.month}`
  const prevData = monthlyMap.get(prevMonthKey) ?? { revenue: 0, count: 0 }

  const currentMonthRevenue = currentData.revenue
  const prevMonthRevenue = prevData.revenue

  const growthPct =
    prevMonthRevenue > 0
      ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : currentMonthRevenue > 0
      ? 100
      : 0

  const avgTicketCurrent =
    currentData.count > 0 ? currentMonthRevenue / currentData.count : 0

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const projectedMonth =
    dayOfMonth > 0 ? (currentMonthRevenue / dayOfMonth) * daysInMonth : 0

  // Projeção anual: média dos últimos 3 meses × 12
  const last3 = monthStats.slice(3, 6)
  const avg3 = last3.length > 0 ? last3.reduce((s, m) => s + m.revenue, 0) / last3.length : 0
  const projectedYear = avg3 * 12

  // Receita acumulada no ano
  const yearRevenue = bookings
    .filter((b) => new Date(b.scheduledAt).getFullYear() === currentYear)
    .reduce((s, b) => s + Number(b.price), 0)

  // Clientes únicos
  const uniqueClients = new Set(bookings.map((b) => b.userId)).size

  // Taxa da plataforma
  const feePercent = Number(tenant.platformFeePercent)
  const platformFee = (yearRevenue * feePercent) / 100
  const netRevenue = yearRevenue - platformFee

  // Barra CSS: maior valor dos 6 meses (excluindo mês atual)
  const displayMonths = monthStats.slice(1) // 6 meses: 1 a 6 (índice 0 era há 6 meses)
  const maxRevenue = Math.max(...displayMonths.map((m) => m.revenue), 1)

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-teal-600" />
          Relatório de Receita
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Faturamento e projeções • últimos 6 meses
        </p>
      </div>

      {/* ── Seção 1: KPI Cards ── */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">

        {/* Receita do mês */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <DollarSign className="w-3.5 h-3.5 text-teal-600" />
            Mês atual
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(currentMonthRevenue)}</p>
          <p className="text-xs text-gray-400">{currentData.count} agendamento{currentData.count !== 1 ? 's' : ''}</p>
        </div>

        {/* vs mês anterior */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            {growthPct >= 0
              ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
            vs mês ant.
          </div>
          <div className="flex items-center gap-1">
            {growthPct >= 0
              ? <ArrowUp className="w-4 h-4 text-green-500" />
              : <ArrowDown className="w-4 h-4 text-red-500" />}
            <span className={`text-2xl font-bold ${growthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pct(growthPct)}
            </span>
          </div>
          <p className="text-xs text-gray-400">mês ant.: {fmt(prevMonthRevenue)}</p>
        </div>

        {/* Ticket médio */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <Target className="w-3.5 h-3.5 text-teal-600" />
            Ticket médio
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(avgTicketCurrent)}</p>
          <p className="text-xs text-gray-400">{uniqueClients} cliente{uniqueClients !== 1 ? 's' : ''} únicos</p>
        </div>

        {/* Projeção do mês */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Projeção mês
          </div>
          <p className="text-2xl font-bold text-teal-700">{fmt(projectedMonth)}</p>
          <p className="text-xs text-gray-400">dia {dayOfMonth}/{daysInMonth}</p>
        </div>
      </section>

      {/* ── Seção 2: Gráfico de barras CSS ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-6">Receita — últimos 6 meses</h2>
        <div className="flex items-end gap-3 h-44">
          {displayMonths.map((m, i) => {
            const isCurrentMonth = i === displayMonths.length - 1
            const heightPct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-gray-600">
                  {m.revenue > 0 ? fmt(m.revenue) : '—'}
                </span>
                <div className="w-full flex items-end" style={{ height: '120px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isCurrentMonth ? 'bg-teal-600' : 'bg-slate-200'
                    }`}
                    style={{ height: `${Math.max(heightPct, m.revenue > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{m.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Seção 3: Projeção anual ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Projeção anual — card destaque */}
        <div className="sm:col-span-1 bg-teal-600 rounded-xl p-6 text-white space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-teal-100 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Projeção {currentYear}
          </div>
          <p className="text-3xl font-bold">{fmt(projectedYear)}</p>
          <p className="text-xs text-teal-200">média dos últ. 3 meses × 12</p>
        </div>

        {/* Acumulado no ano */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
            Acumulado {currentYear}
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(yearRevenue)}</p>
          {projectedYear > 0 && (
            <p className="text-xs text-gray-400">
              {((yearRevenue / projectedYear) * 100).toFixed(0)}% da projeção anual
            </p>
          )}
        </div>

        {/* Taxa da plataforma + receita líquida */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            Taxa plataforma ({feePercent}%)
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxa estimada</span>
              <span className="text-red-500 font-medium">−{fmt(platformFee)}</span>
            </div>
            <div className="border-t pt-1 flex justify-between text-sm font-semibold">
              <span className="text-gray-700">Receita líquida</span>
              <span className="text-teal-700">{fmt(netRevenue)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção 4: Tabela mensal detalhada ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Detalhamento mensal</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50">
                <th className="px-6 py-3 text-left">Mês</th>
                <th className="px-6 py-3 text-right">Agendamentos</th>
                <th className="px-6 py-3 text-right">Receita</th>
                <th className="px-6 py-3 text-right">Ticket médio</th>
                <th className="px-6 py-3 text-right">vs ant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthStats.map((m, i) => {
                const isCurrentMonth = i === monthStats.length - 1
                return (
                  <tr
                    key={m.label}
                    className={`${isCurrentMonth ? 'bg-teal-50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="px-6 py-3 font-medium text-gray-800 capitalize">
                      {m.label}
                      {isCurrentMonth && (
                        <span className="ml-2 text-[10px] bg-teal-100 text-teal-700 rounded-full px-2 py-0.5">
                          atual
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">{m.count}</td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      {m.revenue > 0 ? fmt(m.revenue) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">
                      {m.avgTicket > 0 ? fmt(m.avgTicket) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {m.vsPercent === null ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                            m.vsPercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {m.vsPercent >= 0
                            ? <ArrowUp className="w-3 h-3" />
                            : <ArrowDown className="w-3 h-3" />}
                          {pct(m.vsPercent)}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td className="px-6 py-3 font-semibold text-gray-800">Total</td>
                <td className="px-6 py-3 text-right font-semibold text-gray-800">
                  {monthStats.reduce((s, m) => s + m.count, 0)}
                </td>
                <td className="px-6 py-3 text-right font-bold text-teal-700">
                  {fmt(monthStats.reduce((s, m) => s + m.revenue, 0))}
                </td>
                <td className="px-6 py-3 text-right text-gray-400">—</td>
                <td className="px-6 py-3 text-right text-gray-400">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  )
}
