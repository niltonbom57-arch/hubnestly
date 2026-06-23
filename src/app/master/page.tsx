export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import {
  Building2, Users, DollarSign, Calendar,
  Clock, AlertTriangle, Activity, TrendingUp,
  Percent, Star, CheckCircle2,
  XCircle, Hourglass, Globe
} from 'lucide-react'

export default async function MasterDashboardPage() {
  const session = await auth()
  if (!session?.user?.isPlatformAdmin) redirect('/auth/login')

  const now            = new Date()
  const startOfWeek    = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0)
  const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)


  // ── Queries em paralelo ──────────────────────────────────────────────────────
  const [
    tenants,
    bookingsByStatus,
    weekBookings,
    monthBookings,
    lastMonthBookings,
    monthRevenue,
    lastMonthRevenue,
    totalClients,
    recentBookings,
    recentTenants,
  ] = await Promise.all([
    // Todas as empresas com métricas completas
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, bookings: true } },
        settings: { select: { logoUrl: true, supportEmail: true } },
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED', 'PAID'] } },
          select: { price: true, createdAt: true },
        },
      },
    }),

    // Agendamentos por status (global)
    prisma.booking.groupBy({ by: ['status'], _count: true }),

    // Agendamentos desta semana
    prisma.booking.count({ where: { createdAt: { gte: startOfWeek } } }),

    // Agendamentos deste mês
    prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),

    // Agendamentos mês passado
    prisma.booking.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

    // Receita este mês
    prisma.booking.aggregate({
      _sum: { price: true },
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'PAID'] }, createdAt: { gte: startOfMonth } },
    }),

    // Receita mês passado
    prisma.booking.aggregate({
      _sum: { price: true },
      where: { status: { in: ['CONFIRMED', 'COMPLETED', 'PAID'] }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),

    // Total de clientes finais (role CLIENT)
    prisma.user.count({ where: { role: 'CLIENT' } }),

    // Últimos 8 agendamentos
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user:     { select: { name: true } },
        property: { select: { city: true } },
        tenant:   { select: { name: true, slug: true } },
      },
    }),

    // Últimas empresas cadastradas
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, status: true, plan: true, createdAt: true, platformFeePercent: true },
    }),
  ])

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const monthRevenueValue    = Number(monthRevenue._sum.price    ?? 0)
  const lastMonthRevenueValue = Number(lastMonthRevenue._sum.price ?? 0)
  const revenueGrowth        = lastMonthRevenueValue > 0
    ? ((monthRevenueValue - lastMonthRevenueValue) / lastMonthRevenueValue * 100).toFixed(1)
    : null
  const bookingGrowth        = lastMonthBookings > 0
    ? ((monthBookings - lastMonthBookings) / lastMonthBookings * 100).toFixed(1)
    : null

  const activeTenants    = tenants.filter(t => t.status === 'ACTIVE').length
  const trialTenants     = tenants.filter(t => t.status === 'TRIAL').length
  const suspendedTenants = tenants.filter(t => t.status === 'SUSPENDED').length
  const totalBookings    = bookingsByStatus.reduce((s, b) => s + b._count, 0)
  const completedBookings = bookingsByStatus.find(b => b.status === 'COMPLETED')?._count ?? 0

  // Receita total histórica da plataforma
  const totalRevenue = tenants.reduce((sum, t) => sum + t.bookings.reduce((s, b) => s + Number(b.price), 0), 0)

  // Taxa média da plataforma
  const avgFee = tenants.length > 0
    ? tenants.reduce((s, t) => s + Number(t.platformFeePercent), 0) / tenants.length
    : 10

  // Receita da plataforma (taxas cobradas)
  const platformRevenue = tenants.reduce((sum, t) => {
    const tenantRevenue = t.bookings.reduce((s, b) => s + Number(b.price), 0)
    return sum + (tenantRevenue * Number(t.platformFeePercent) / 100)
  }, 0)

  // Métricas por empresa
  const tenantMetrics = tenants.map(t => ({
    id:            t.id,
    name:          t.name,
    slug:          t.slug,
    status:        t.status,
    plan:          t.plan,
    fee:           Number(t.platformFeePercent),
    clients:       t._count.users,
    bookings:      t._count.bookings,
    revenue:       t.bookings.reduce((s, b) => s + Number(b.price), 0),
    platformEarning: t.bookings.reduce((s, b) => s + Number(b.price), 0) * Number(t.platformFeePercent) / 100,
    createdAt:     t.createdAt,
    logoUrl:       t.settings?.logoUrl,
  })).sort((a, b) => b.revenue - a.revenue)

  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING:     { label: 'Pendente',     color: 'bg-amber-100 text-amber-700'   },
    PAID:        { label: 'Pago',         color: 'bg-blue-100 text-blue-700'     },
    CONFIRMED:   { label: 'Confirmado',   color: 'bg-teal-100 text-teal-700'     },
    IN_PROGRESS: { label: 'Em andamento', color: 'bg-purple-100 text-purple-700' },
    COMPLETED:   { label: 'Concluído',    color: 'bg-green-100 text-green-700'   },
    CANCELLED:   { label: 'Cancelado',    color: 'bg-red-100 text-red-700'       },
  }

  const tenantStatusCfg: Record<string, { label: string; color: string; dot: string }> = {
    TRIAL:     { label: 'Trial',     color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
    ACTIVE:    { label: 'Ativo',     color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    SUSPENDED: { label: 'Suspenso',  color: 'bg-red-100 text-red-700',    dot: 'bg-red-500'   },
    CANCELLED: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  }

  const planCfg: Record<string, { label: string; color: string }> = {
    STARTER: { label: 'Starter', color: 'bg-slate-100 text-slate-600'  },
    PRO:     { label: 'Pro',     color: 'bg-blue-100 text-blue-700'    },
    SCALE:   { label: 'Scale',   color: 'bg-purple-100 text-purple-700'},
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#1A6335]" /> Panorama Geral da Plataforma
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Sistema operacional</span>
        </div>
      </div>

      {/* KPIs linha 1 — Plataforma */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Empresas & Receita</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Building2 className="w-5 h-5 text-[#1A6335]" />}
            bg="bg-green-50"
            label="Total de empresas"
            value={String(tenants.length)}
            sub={`${activeTenants} ativas · ${trialTenants} trial${suspendedTenants > 0 ? ` · ⚠ ${suspendedTenants} suspensa` : ''}`}
          />
          <KpiCard
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            bg="bg-emerald-50"
            label="Receita este mês"
            value={`$${monthRevenueValue.toFixed(2)}`}
            sub={revenueGrowth ? `${Number(revenueGrowth) >= 0 ? '▲' : '▼'} ${Math.abs(Number(revenueGrowth))}% vs mês anterior` : 'Primeiro mês'}
            positive={revenueGrowth ? Number(revenueGrowth) >= 0 : undefined}
          />
          <KpiCard
            icon={<Percent className="w-5 h-5 text-[#D03258]" />}
            bg="bg-rose-50"
            label="Ganho da plataforma"
            value={`$${platformRevenue.toFixed(2)}`}
            sub={`Taxa média: ${avgFee.toFixed(1)}% por empresa`}
          />
          <KpiCard
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            bg="bg-blue-50"
            label="Receita total histórica"
            value={`$${totalRevenue.toFixed(2)}`}
            sub={`${completedBookings} limpezas concluídas`}
          />
        </div>
      </div>

      {/* KPIs linha 2 — Clientes & Agendamentos */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Clientes & Agendamentos</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Users className="w-5 h-5 text-violet-600" />}
            bg="bg-violet-50"
            label="Clientes finais"
            value={String(totalClients)}
            sub="usuários com role CLIENT"
          />
          <KpiCard
            icon={<Calendar className="w-5 h-5 text-teal-600" />}
            bg="bg-teal-50"
            label="Limpezas esta semana"
            value={String(weekBookings)}
            sub="desde domingo"
          />
          <KpiCard
            icon={<Calendar className="w-5 h-5 text-blue-600" />}
            bg="bg-blue-50"
            label="Limpezas este mês"
            value={String(monthBookings)}
            sub={bookingGrowth ? `${Number(bookingGrowth) >= 0 ? '▲' : '▼'} ${Math.abs(Number(bookingGrowth))}% vs mês anterior` : 'Primeiro mês'}
            positive={bookingGrowth ? Number(bookingGrowth) >= 0 : undefined}
          />
          <KpiCard
            icon={<Activity className="w-5 h-5 text-orange-500" />}
            bg="bg-orange-50"
            label="Total de agendamentos"
            value={String(totalBookings)}
            sub="histórico completo"
          />
        </div>
      </div>

      {/* Status dos agendamentos */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1A6335]" /> Status de todos os agendamentos
        </h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {bookingsByStatus.map(({ status, _count }) => {
            const s = statusMap[status] ?? { label: status, color: 'bg-slate-100 text-slate-600' }
            const pct = totalBookings > 0 ? (_count / totalBookings * 100).toFixed(0) : '0'
            return (
              <div key={status} className="text-center">
                <p className="text-3xl font-black text-slate-900">{_count}</p>
                <p className="text-xs text-slate-400 mb-1">{pct}% do total</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
              </div>
            )
          })}
          {bookingsByStatus.length === 0 && (
            <div className="col-span-6 text-center text-slate-400 text-sm py-6">Nenhum agendamento ainda</div>
          )}
        </div>
      </div>

      {/* Tabela de empresas — coração do dashboard */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#1A6335]" /> Empresas — Métricas detalhadas
          </h2>
          <span className="text-xs text-slate-400">{tenants.length} empresa{tenants.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/60">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plano</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Taxa</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Clientes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Agendamentos</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Faturamento</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ganho plataforma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tenantMetrics.map((t, i) => {
                const st = (tenantStatusCfg[t.status] ?? tenantStatusCfg['ACTIVE'])!
                const pl = (planCfg[t.plan] ?? planCfg['STARTER'])!
                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1A6335]/10 to-[#D03258]/10 flex items-center justify-center shrink-0 text-sm font-bold text-[#1A6335]">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{t.name}</p>
                          <p className="text-xs text-slate-400">/{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pl.color}`}>{pl.label}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-bold text-[#D03258]">{t.fee}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-700">{t.clients}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-700">{t.bookings}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-bold text-slate-800">${t.revenue.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-[#1A6335]">${t.platformEarning.toFixed(2)}</span>
                    </td>
                  </tr>
                )
              })}
              {tenantMetrics.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">Nenhuma empresa cadastrada</td>
                </tr>
              )}
            </tbody>
            {tenantMetrics.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Totais</td>
                  <td className="px-4 py-3 text-right text-sm font-black text-slate-800">
                    {tenantMetrics.reduce((s, t) => s + t.clients, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-black text-slate-800">
                    {tenantMetrics.reduce((s, t) => s + t.bookings, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-black text-slate-800">
                    ${totalRevenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-black text-[#1A6335]">
                    ${platformRevenue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Últimos agendamentos */}
        <section className="space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1A6335]" /> Últimos agendamentos
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            {recentBookings.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Nenhum agendamento ainda</div>
            ) : recentBookings.map((b) => {
              const s = statusMap[b.status] ?? { label: b.status, color: 'bg-slate-100 text-slate-600' }
              return (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{b.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {b.property?.city ?? '—'} · <span className="text-[#1A6335] font-medium">{b.tenant.name}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    <span className="font-bold text-slate-700 text-sm">${Number(b.price).toFixed(2)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Novas empresas + Alertas */}
        <div className="space-y-6">
          {/* Alertas */}
          {(suspendedTenants > 0 || trialTenants > 0) && (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 space-y-3">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas
              </h2>
              {suspendedTenants > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{suspendedTenants} empresa(s) suspensa(s) — requer atenção</p>
                </div>
              )}
              {trialTenants > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <Hourglass className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700 font-medium">{trialTenants} empresa(s) em período trial</p>
                </div>
              )}
            </div>
          )}

          {/* Novas empresas */}
          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Empresas recentes
            </h2>
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
              {recentTenants.map((t) => {
                const st = (tenantStatusCfg[t.status] ?? tenantStatusCfg['ACTIVE'])!
                const pl = (planCfg[t.plan]  ?? planCfg['STARTER'])!
                return (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{t.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString('pt-BR')} · Taxa: <span className="text-[#D03258] font-semibold">{Number(t.platformFeePercent)}%</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pl.color}`}>{pl.label}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
              {recentTenants.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">Nenhuma empresa ainda</div>
              )}
            </div>
          </section>

          {/* Resumo financeiro */}
          <div className="bg-gradient-to-br from-[#0F3320] to-[#1A6335] rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Resumo financeiro</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Faturamento total das empresas</span>
                <span className="font-bold">${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Ganho da plataforma (taxas)</span>
                <span className="font-bold text-[#4ACA6A]">${platformRevenue.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Este mês</span>
                <span className="font-bold">${monthRevenueValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Mês anterior</span>
                <span className="font-bold text-white/60">${lastMonthRevenueValue.toFixed(2)}</span>
              </div>
              {revenueGrowth && (
                <div className={`flex items-center gap-2 mt-1 text-sm font-semibold ${Number(revenueGrowth) >= 0 ? 'text-[#4ACA6A]' : 'text-red-300'}`}>
                  {Number(revenueGrowth) >= 0 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {Number(revenueGrowth) >= 0 ? '+' : ''}{revenueGrowth}% vs mês anterior
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, bg, label, value, sub, positive }: {
  icon: React.ReactNode
  bg: string
  label: string
  value: string
  sub: string
  positive?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className={`text-xs mt-0.5 ${positive === true ? 'text-green-600 font-semibold' : positive === false ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>{sub}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
