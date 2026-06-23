export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/require-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Users, DollarSign, Calendar,
  Clock, AlertTriangle,
  Activity, Globe, Star
} from 'lucide-react'

export default async function MasterDashboardPage() {
  const user = await requireAuth()
  if (!user.isPlatformAdmin) redirect('/dashboard')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000)

  const [
    tenants,
    totalUsers,
    totalBookings,
    recentBookings,
    monthRevenue,
    weekRevenue,
    bookingsByStatus,
    topTenants,
    recentUsers,
  ] = await Promise.all([
    // Todas as empresas com contagens
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, bookings: true },
        },
        settings: { select: { logoUrl: true } },
      },
    }),

    // Total de usuários
    prisma.user.count(),

    // Total de bookings
    prisma.booking.count(),

    // Últimos 10 agendamentos de todas as empresas
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user:     { select: { name: true, email: true } },
        property: { select: { nickname: true, city: true } },
        tenant:   { select: { name: true, slug: true } },
      },
    }),

    // Receita últimos 30 dias
    prisma.booking.aggregate({
      _sum: { price: true },
      where: {
        status:    { in: ['CONFIRMED', 'COMPLETED', 'PAID'] },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),

    // Receita últimos 7 dias
    prisma.booking.aggregate({
      _sum: { price: true },
      where: {
        status:    { in: ['CONFIRMED', 'COMPLETED', 'PAID'] },
        createdAt: { gte: sevenDaysAgo },
      },
    }),

    // Bookings por status
    prisma.booking.groupBy({
      by: ['status'],
      _count: true,
    }),

    // Top 5 empresas por número de bookings
    prisma.tenant.findMany({
      take: 5,
      include: {
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Últimos usuários cadastrados
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, name: true, email: true, role: true,
        createdAt: true,
        tenant: { select: { name: true, slug: true } },
      },
    }),
  ])

  const monthRevenueValue = Number(monthRevenue._sum.price ?? 0)
  const weekRevenueValue  = Number(weekRevenue._sum.price  ?? 0)

  const activeTenants    = tenants.filter(t => t.status === 'ACTIVE').length
  const trialTenants     = tenants.filter(t => t.status === 'TRIAL').length
  const suspendedTenants = tenants.filter(t => t.status === 'SUSPENDED').length

  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING:     { label: 'Pendente',     color: 'bg-amber-100 text-amber-700'  },
    PAID:        { label: 'Pago',         color: 'bg-blue-100 text-blue-700'    },
    CONFIRMED:   { label: 'Confirmado',   color: 'bg-teal-100 text-teal-700'    },
    IN_PROGRESS: { label: 'Em andamento', color: 'bg-purple-100 text-purple-700'},
    COMPLETED:   { label: 'Concluído',    color: 'bg-green-100 text-green-700'  },
    CANCELLED:   { label: 'Cancelado',    color: 'bg-red-100 text-red-700'      },
  }

  const tenantStatusMap: Record<string, { label: string; color: string }> = {
    TRIAL:     { label: 'Trial',     color: 'bg-amber-100 text-amber-700'  },
    ACTIVE:    { label: 'Ativo',     color: 'bg-green-100 text-green-700'  },
    SUSPENDED: { label: 'Suspenso',  color: 'bg-red-100 text-red-700'      },
    CANCELLED: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500'  },
  }

  const topTenantsWithRevenue = topTenants
    .map(t => ({
      ...t,
      revenue: 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1A6335] to-[#D03258] flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Master Dashboard</h1>
          </div>
          <p className="text-slate-500 text-sm">Visão geral de toda a plataforma HubNestly</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Atualizado agora</p>
          <p className="text-xs font-semibold text-slate-600">
            {now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Building2 className="w-5 h-5 text-[#1A6335]" />}
          bg="bg-green-50"
          label="Empresas"
          value={String(tenants.length)}
          sub={`${activeTenants} ativas · ${trialTenants} trial`}
          alert={suspendedTenants > 0 ? `${suspendedTenants} suspensa(s)` : undefined}
        />
        <KpiCard
          icon={<Users className="w-5 h-5 text-violet-600" />}
          bg="bg-violet-50"
          label="Usuários"
          value={String(totalUsers)}
          sub="total na plataforma"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Receita 30 dias"
          value={`$${monthRevenueValue.toFixed(2)}`}
          sub={`$${weekRevenueValue.toFixed(2)} esta semana`}
        />
        <KpiCard
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
          label="Agendamentos"
          value={String(totalBookings)}
          sub="total histórico"
        />
      </div>

      {/* Bookings por status */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1A6335]" /> Status dos agendamentos
        </h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {bookingsByStatus.map(({ status, _count }) => {
            const s = statusMap[status] ?? { label: status, color: 'bg-slate-100 text-slate-600' }
            return (
              <div key={status} className="text-center">
                <p className="text-2xl font-black text-slate-900">{_count}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Todas as empresas */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1A6335]" /> Empresas cadastradas
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            {tenants.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Nenhuma empresa cadastrada</div>
            ) : (
              tenants.map((t) => {
                const st = tenantStatusMap[t.status] ?? { label: t.status, color: 'bg-slate-100 text-slate-500' }

                return (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A6335]/10 to-[#D03258]/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-[#1A6335]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t._count.users} usuários · {t._count.bookings} agendamentos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      <Link href={`/t/${t.slug}/admin`} className="text-xs text-[#1A6335] hover:underline font-medium">
                        Ver →
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Top empresas por receita */}
        <section className="space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Top empresas por receita
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            {topTenantsWithRevenue.map((t, i) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
                    i === 0 ? 'bg-amber-100 text-amber-600' :
                    i === 1 ? 'bg-slate-100 text-slate-500' :
                    i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                  }`}>{i + 1}</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {t.name}
                    </p>
                    <p className="text-xs text-slate-400">{t._count.bookings} agendamentos</p>
                  </div>
                </div>
                <p className="font-bold text-[#1A6335]">{t._count.bookings} jobs</p>
              </div>
            ))}
            {topTenantsWithRevenue.length === 0 && (
              <div className="py-10 text-center text-slate-400 text-sm">Nenhuma receita ainda</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Últimos agendamentos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1A6335]" /> Últimos agendamentos
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            {recentBookings.map((b) => {
              const s = statusMap[b.status] ?? { label: b.status, color: 'bg-slate-100 text-slate-600' }
              return (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{b.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {b.property?.city ?? '—'} · <span className="text-[#1A6335] font-medium">{b.tenant.name}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    <span className="font-bold text-slate-700 text-sm">${Number(b.price).toFixed(2)}</span>
                  </div>
                </div>
              )
            })}
            {recentBookings.length === 0 && (
              <div className="py-10 text-center text-slate-400 text-sm">Nenhum agendamento ainda</div>
            )}
          </div>
        </section>

        {/* Últimos usuários */}
        <section className="space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" /> Últimos usuários cadastrados
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            {recentUsers.map((u) => (
              <div key={u.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {u.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-500">{u.tenant.name}</p>
                  <p className="text-xs text-slate-300">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <div className="py-10 text-center text-slate-400 text-sm">Nenhum usuário ainda</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function KpiCard({ icon, bg, label, value, sub, alert }: {
  icon: React.ReactNode
  bg: string
  label: string
  value: string
  sub: string
  alert?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
      {alert && (
        <div className="flex items-center gap-1 mt-2">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-xs text-amber-600 font-medium">{alert}</span>
        </div>
      )}
    </div>
  )
}
