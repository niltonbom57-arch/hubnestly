export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import { BookingStatus } from '@prisma/client'
import {
  DollarSign, Calendar, Users, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ArrowRight, Sparkles, Share2,
} from 'lucide-react'
import Link from 'next/link'
import { SharePageButton } from '@/components/admin/SharePageButton'


interface Props {
  params: { tenantSlug: string }
}

function fmt(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function fmtDate(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'America/New_York',
  })
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

const STATUS_LABEL: Record<BookingStatus, { label: string; color: string }> = {
  PENDING:     { label: 'Pendente',      color: 'bg-amber-100 text-amber-700' },
  PAID:        { label: 'Pago',          color: 'bg-blue-100 text-blue-700' },
  CONFIRMED:   { label: 'Confirmado',    color: 'bg-teal-100 text-teal-700' },
  IN_PROGRESS: { label: 'Em andamento',  color: 'bg-purple-100 text-purple-700' },
  COMPLETED:   { label: 'Concluído',     color: 'bg-green-100 text-green-700' },
  CANCELLED:   { label: 'Cancelado',     color: 'bg-red-100 text-red-700' },
}

export default async function TenantAdminDashboard({ params }: Props) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as { tenantId?: string; role?: string } | undefined

  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant) notFound()
  if (sessionUser?.tenantId !== tenant.id || sessionUser?.role !== 'ADMIN') notFound()

  const tenantId = tenant.id
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  // ── Queries em paralelo ──────────────────────────────────────
  const [
    revenueThisMonth,
    revenueLastMonth,
    bookingsThisMonth,
    totalCustomers,
    todayBookings,
    pendingBookings,
    upcomingBookings,
    revenueByWeek,
  ] = await Promise.all([
    // Receita mês atual (limpezas pagas/concluídas)
    prisma.booking.aggregate({
      where: { tenantId, status: { in: ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] }, scheduledAt: { gte: startOfMonth } },
      _sum: { price: true },
    }),
    // Receita mês passado
    prisma.booking.aggregate({
      where: { tenantId, status: { in: ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] }, scheduledAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { price: true },
    }),
    // Total agendamentos mês atual
    prisma.booking.count({
      where: { tenantId, scheduledAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
    }),
    // Total clientes únicos (pagantes no mês)
    prisma.booking.groupBy({
      by: ['userId'],
      where: { tenantId, status: { in: ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] }, scheduledAt: { gte: startOfMonth } },
    }),
    // Agendamentos de hoje
    prisma.booking.findMany({
      where: { tenantId, scheduledAt: { gte: todayStart, lte: todayEnd }, status: { not: 'CANCELLED' } },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true, scheduledAt: true, status: true, price: true,
        property: { select: { nickname: true, address: true, city: true } },
        team: { select: { name: true, color: true } },
        user: { select: { name: true } },
      },
    }),
    // Agendamentos pendentes de confirmação
    prisma.booking.count({ where: { tenantId, status: 'PENDING' } }),
    // Próximos 5 agendamentos futuros
    prisma.booking.findMany({
      where: { tenantId, scheduledAt: { gt: todayEnd }, status: { in: ['PAID', 'CONFIRMED'] } },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      select: {
        id: true, scheduledAt: true, status: true, price: true,
        property: { select: { nickname: true, city: true } },
        user: { select: { name: true } },
      },
    }),
    // Receita dos últimos 4 meses (para mini-gráfico)
    Promise.all(Array.from({ length: 4 }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      return prisma.booking.aggregate({
        where: { tenantId, status: { in: ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] }, scheduledAt: { gte: start, lte: end } },
        _sum: { price: true },
      }).then((r) => ({
        label: start.toLocaleDateString('pt-BR', { month: 'short' }),
        value: Number(r._sum.price ?? 0),
      }))
    })),
  ])

  const revenueNow = Number(revenueThisMonth._sum.price ?? 0)
  const revenuePrev = Number(revenueLastMonth._sum.price ?? 0)
  const revenueGrowth = revenuePrev > 0 ? Math.round(((revenueNow - revenuePrev) / revenuePrev) * 100) : null
  const payingCustomers = totalCustomers.length
  const maxBar = Math.max(...revenueByWeek.map((m) => m.value), 1)

  // Fee estimado do mês (plano automático)
  const feeRate = payingCustomers <= 30 ? 0.08 : payingCustomers <= 150 ? 0.05 : 0.03
  const feePlan = payingCustomers <= 30 ? 'Starter' : payingCustomers <= 150 ? 'Pro' : 'Scale'
  const feeEstimated = revenueNow * feeRate

  return (
    <div className="space-y-8">

      {/* ── Cabeçalho ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/New_York' })}
          </p>
        </div>
        {pendingBookings > 0 && (
          <Link href={`/t/${params.tenantSlug}/admin/bookings?status=PENDING`}>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold rounded-xl px-4 py-2 hover:bg-amber-100 transition-colors">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              {pendingBookings} agendamento{pendingBookings > 1 ? 's' : ''} aguardando confirmação
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        )}
      </div>

      {/* ── Card: Compartilhar página ─────────────── */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white text-sm">Página de agendamento online</p>
            <p className="text-teal-100 text-xs mt-0.5">
              Compartilhe com seus clientes para que eles agendem diretamente
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/t/${params.tenantSlug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl px-3 py-2 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" /> Ver página
          </Link>
          <SharePageButton
            tenantSlug={params.tenantSlug}
            tenantName={tenant.name}
            variant="dashboard"
          />
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Receita do mês */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            {revenueGrowth !== null && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${revenueGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}%
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-slate-900">{fmt(revenueNow)}</p>
          <p className="text-xs text-slate-400 mt-1">Receita este mês</p>
        </div>

        {/* Agendamentos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="w-9 h-9 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{bookingsThisMonth}</p>
          <p className="text-xs text-slate-400 mt-1">Agendamentos este mês</p>
        </div>

        {/* Clientes pagantes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{payingCustomers}</p>
          <p className="text-xs text-slate-400 mt-1">Clientes pagantes/mês</p>
        </div>

        {/* Fee estimado */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {feePlan} · {Math.round(feeRate * 100)}%
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">{fmt(feeEstimated)}</p>
          <p className="text-xs text-slate-400 mt-1">Fee HubNestly estimado/mês</p>
        </div>
      </div>

      {/* ── Gráfico de receita + Hoje ──────────────── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Mini gráfico de barras */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-slate-900 text-sm">Receita mensal</p>
              <p className="text-xs text-slate-400">Últimos 4 meses</p>
            </div>
            <TrendingUp className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-end gap-3 h-28">
            {[...revenueByWeek].reverse().map((m, i) => {
              const pct = maxBar > 0 ? (m.value / maxBar) * 100 : 0
              const isCurrent = i === revenueByWeek.length - 1
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-medium">{fmt(m.value)}</span>
                  <div className="w-full relative flex items-end" style={{ height: '64px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all ${isCurrent ? 'bg-teal-500' : 'bg-slate-200'}`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold capitalize ${isCurrent ? 'text-teal-600' : 'text-slate-400'}`}>
                    {m.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Agenda de hoje */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-slate-900 text-sm">Agenda de hoje</p>
              <p className="text-xs text-slate-400">{todayBookings.length} agendamento{todayBookings.length !== 1 ? 's' : ''}</p>
            </div>
            <Link href={`/t/${params.tenantSlug}/admin/calendar`} className="text-xs text-teal-600 hover:text-teal-700 font-semibold">
              Ver calendário →
            </Link>
          </div>

          {todayBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nenhum agendamento hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayBookings.map((b) => {
                const st = STATUS_LABEL[b.status]
                return (
                  <Link
                    key={b.id}
                    href={`/t/${params.tenantSlug}/admin/bookings/${b.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="text-center w-14 shrink-0">
                      <p className="text-teal-600 font-black text-sm font-mono">{fmtTime(new Date(b.scheduledAt))}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{b.user?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400 truncate">{b.property?.nickname} · {b.property?.city}</p>
                    </div>
                    {b.team && (
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0 hidden sm:block">{b.team.name}</span>
                    )}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                    <span className="text-sm font-bold text-slate-700 shrink-0">${Number(b.price).toFixed(0)}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Próximos agendamentos + Resumo do plano ─ */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Próximos agendamentos */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-slate-900 text-sm">Próximos agendamentos</p>
              <p className="text-xs text-slate-400">Confirmados e pagos</p>
            </div>
            <Link href={`/t/${params.tenantSlug}/admin/bookings`} className="text-xs text-teal-600 hover:text-teal-700 font-semibold">
              Ver todos →
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nenhum agendamento futuro</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map((b) => {
                const st = STATUS_LABEL[b.status]
                return (
                  <Link
                    key={b.id}
                    href={`/t/${params.tenantSlug}/admin/bookings/${b.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-[10px] text-slate-400 font-medium">{fmtDate(new Date(b.scheduledAt))}</p>
                      <p className="text-teal-600 font-bold text-xs font-mono">{fmtTime(new Date(b.scheduledAt))}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{b.user?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400 truncate">{b.property?.city}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                    <span className="text-sm font-bold text-slate-700 shrink-0">${Number(b.price).toFixed(0)}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Resumo do plano */}
        <div className="lg:col-span-2 space-y-4">
          {/* Plano atual */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <p className="text-teal-300 text-xs font-bold uppercase tracking-wide">Plano atual</p>
            </div>
            <p className="text-white font-black text-2xl mb-1">{feePlan}</p>
            <p className="text-slate-400 text-sm mb-4">
              {Math.round(feeRate * 100)}% por limpeza · {payingCustomers} cliente{payingCustomers !== 1 ? 's' : ''} pagantes este mês
            </p>

            {/* Barra de progresso do limite */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>{payingCustomers} pagantes</span>
                <span>{feePlan === 'Scale' ? '150+ ✓' : feePlan === 'Pro' ? 'limite 150' : 'limite 30'}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((payingCustomers / (feePlan === 'Starter' ? 30 : 150)) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-xl px-3 py-2.5">
              <p className="text-slate-400 text-xs">Fee estimado este mês</p>
              <p className="text-white font-black text-lg">{fmt(feeEstimated)}</p>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-bold text-slate-800 mb-3">Ações rápidas</p>
            <div className="space-y-2">
              {[
                { label: 'Ver todos os clientes',    href: `${`/t/${params.tenantSlug}/admin`}/customers`,  icon: <Users className="w-3.5 h-3.5" /> },
                { label: 'Gerenciar equipes',        href: `${`/t/${params.tenantSlug}/admin`}/teams`,       icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                { label: 'Relatório de receita',     href: `${`/t/${params.tenantSlug}/admin`}/revenue`,     icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { label: 'Configurações da empresa', href: `${`/t/${params.tenantSlug}/admin`}/settings`,    icon: <Sparkles className="w-3.5 h-3.5" /> },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl px-3 py-2 transition-colors"
                >
                  <span className="text-teal-500">{item.icon}</span>
                  {item.label}
                  <ArrowRight className="w-3 h-3 ml-auto text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
