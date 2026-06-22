export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/require-auth'

import { Badge } from '@/components/ui/badge'
import { formatEt } from '@/lib/scheduling/timezone'
import { startOfDay, endOfDay } from 'date-fns'
import {
  DollarSign, Calendar, Users, CheckCircle2,
  Bell, TrendingUp, Clock, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const user = await requireAuth()
  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [todayBookings, weekRevenue, totalCustomers, completedCount, recentNotifications] = await Promise.all([
    prisma.booking.findMany({
      where: {
        tenantId: user.tenantId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
      },
      include: { property: true, team: true, user: { select: { name: true } } },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.booking.aggregate({
      _sum: { price: true },
      where: {
        tenantId: user.tenantId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        scheduledAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.user.count({ where: { tenantId: user.tenantId, role: 'CLIENT' } }),
    prisma.booking.count({ where: { tenantId: user.tenantId, status: 'COMPLETED' } }),
    prisma.notification.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { booking: { select: { id: true } } },
    }),
  ])

  const weekRevenueValue = Number(weekRevenue._sum.price ?? 0)
  const unreadCount = recentNotifications.filter((n) => !n.read).length

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          {today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Calendar className="w-5 h-5 text-teal-600" />}
          bg="bg-teal-50"
          label="Hoje"
          value={String(todayBookings.length)}
          sub="agendamentos"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Últimos 7 dias"
          value={`$${weekRevenueValue.toFixed(2)}`}
          sub="receita"
        />
        <KpiCard
          icon={<Users className="w-5 h-5 text-violet-600" />}
          bg="bg-violet-50"
          label="Clientes"
          value={String(totalCustomers)}
          sub="cadastrados"
        />
        <KpiCard
          icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
          label="Concluídos"
          value={String(completedCount)}
          sub="total histórico"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Agendamentos de hoje */}
        <section className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" /> Agendamentos de hoje
            </h2>
            <Link href="/admin/bookings" className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {todayBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center">
              <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Nenhum agendamento para hoje.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayBookings.map((b) => (
                <Link key={b.id} href={`/admin/bookings/${b.id}`}>
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-teal-200 hover:shadow-sm transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{b.property?.nickname ?? 'Imóvel'}</p>
                        <p className="text-xs text-slate-400">
                          {formatEt(b.scheduledAt, 'HH:mm')} · {b.property?.city} · {b.user.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {b.team && (
                        <Badge style={{ backgroundColor: b.team.color ?? '#0d9488', color: 'white' }} className="text-xs">
                          {b.team.name}
                        </Badge>
                      )}
                      <span className="font-bold text-teal-600">${Number(b.price).toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Notificações recentes */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" /> Notificações
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            {recentNotifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Nenhuma notificação ainda.</p>
                <p className="text-slate-300 text-xs mt-1">Aparecerá aqui quando um agendamento for confirmado.</p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-teal-50/50' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-teal-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] text-slate-300">
                          {new Date(n.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {n.booking && (
                          <Link href={`/admin/bookings/${n.booking.id}`} className="text-[11px] text-teal-600 font-medium hover:underline">
                            Ver →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function KpiCard({ icon, bg, label, value, sub }: {
  icon: React.ReactNode
  bg: string
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub} · <span className="text-slate-500">{label}</span></p>
    </div>
  )
}
