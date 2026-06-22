export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import { BookingStatus } from '@prisma/client'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Users,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { tenantSlug: string }
  searchParams: { month?: string }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v)
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

function fmtDay(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month, 1)
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function localDay(d: Date): Date {
  // Returns a "local" Date in America/New_York for day comparison
  const str = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  return new Date(`${str}T00:00:00`)
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-teal-100 text-teal-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function AdminCalendarPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions)
  const tenant = await resolveTenantBySlug(params.tenantSlug)

  if (!tenant) notFound()

  if (
    !session?.user ||
    (session.user as { tenantId?: string; role?: string }).tenantId !== tenant.id ||
    (session.user as { tenantId?: string; role?: string }).role !== 'ADMIN'
  ) {
    notFound()
  }

  // ── Month resolution ───────────────────────────────────────────────────────
  const today = new Date()
  const monthParam =
    searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)
      ? searchParams.month
      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [yearStr = '', monthStr = ''] = monthParam.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1 // 0-indexed

  const start = new Date(`${monthParam}-01T00:00:00Z`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)

  // ── Prev / Next month slugs ────────────────────────────────────────────────
  const prevDate = new Date(year, month - 1, 1)
  const nextDate = new Date(year, month + 1, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
  const basePath = `/t/${params.tenantSlug}/admin/calendar`

  // ── Data fetching ──────────────────────────────────────────────────────────
  const [bookings, teams] = await Promise.all([
    prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        scheduledAt: { gte: start, lt: end },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        user: { select: { name: true } },
        property: { select: { nickname: true, city: true } },
        team: { select: { name: true, color: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.team.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalRevenue = bookings
    .filter((b) => ['PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.price), 0)

  const bookingsByTeam = teams.map((team) => ({
    ...team,
    count: bookings.filter((b) => b.teamId === team.id).length,
  }))

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const days = getDaysInMonth(year, month)
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sun
  const paddingBefore = firstDayOfWeek
  const totalCells = Math.ceil((days.length + paddingBefore) / 7) * 7
  const paddingAfter = totalCells - days.length - paddingBefore

  const todayLocal = localDay(today)

  // Map bookings to local day strings
  const bookingsByDay = new Map<string, typeof bookings>()
  for (const b of bookings) {
    const key = b.scheduledAt
      .toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    const existing = bookingsByDay.get(key) ?? []
    bookingsByDay.set(key, [...existing, b])
  }

  // ── Group bookings by date label for list panel ────────────────────────────
  type BookingWithRelations = (typeof bookings)[number]
  const groupedByDate: { label: string; items: BookingWithRelations[] }[] = []
  let lastLabel = ''
  for (const b of bookings) {
    const label = fmtDay(b.scheduledAt)
    if (label !== lastLabel) {
      groupedByDate.push({ label, items: [] })
      lastLabel = label
    }
    groupedByDate[groupedByDate.length - 1]?.items.push(b)
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" />
            Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Visual overview of all scheduled bookings</p>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-3">
          <Link
            href={`${basePath}?month=${prevMonth}`}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <span className="text-base font-semibold text-slate-800 min-w-[160px] text-center">
            {monthLabel}
          </span>
          <Link
            href={`${basePath}?month=${nextMonth}`}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </Link>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Bookings</p>
            <p className="text-2xl font-bold text-slate-800">{bookings.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Confirmed Revenue</p>
            <p className="text-2xl font-bold text-slate-800">{fmt(totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Active Teams</p>
            <p className="text-2xl font-bold text-slate-800">{teams.length}</p>
          </div>
        </div>
      </div>

      {/* ── Team legend ── */}
      {teams.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Teams:</span>
          {bookingsByTeam.map((team) => (
            <div key={team.id} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: team.color ?? '#94a3b8' }}
              />
              <span className="text-sm text-slate-700">{team.name}</span>
              <span className="text-xs text-slate-400">({team.count})</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Calendar grid + List ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {/* Padding before */}
            {Array.from({ length: paddingBefore }).map((_, i) => (
              <div
                key={`before-${i}`}
                className="min-h-[90px] border-b border-r border-slate-100 bg-slate-50/50 opacity-40"
              />
            ))}

            {/* Month days */}
            {days.map((day) => {
              const key = day.toLocaleDateString('en-CA')
              const dayBookings = bookingsByDay.get(key) ?? []
              const isToday = isSameDay(day, todayLocal)
              const hasBookings = dayBookings.length > 0

              return (
                <div
                  key={key}
                  className={[
                    'min-h-[90px] border-b border-r border-slate-100 p-1.5 flex flex-col gap-1',
                    isToday ? 'ring-2 ring-inset ring-teal-400' : '',
                    hasBookings ? 'bg-teal-50/40' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span
                    className={[
                      'text-xs font-semibold self-start px-1',
                      isToday
                        ? 'bg-teal-600 text-white rounded-full w-5 h-5 flex items-center justify-center'
                        : 'text-slate-600',
                    ].join(' ')}
                  >
                    {day.getDate()}
                  </span>

                  {/* Booking dots */}
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {dayBookings.slice(0, 5).map((b) => (
                      <span
                        key={b.id}
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: b.team?.color ?? '#94a3b8' }}
                        title={`${fmtTime(b.scheduledAt)} · ${b.user.name} · ${b.team?.name ?? 'Unassigned'}`}
                      />
                    ))}
                    {dayBookings.length > 5 && (
                      <span className="text-[10px] text-slate-400 leading-none self-end">
                        +{dayBookings.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Padding after */}
            {Array.from({ length: paddingAfter }).map((_, i) => (
              <div
                key={`after-${i}`}
                className="min-h-[90px] border-b border-r border-slate-100 bg-slate-50/50 opacity-40"
              />
            ))}
          </div>
        </div>

        {/* Booking list panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              Bookings this month
              <span className="ml-2 text-slate-400 font-normal">({bookings.length})</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[520px]">
            {groupedByDate.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Calendar className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No bookings this month</p>
              </div>
            )}

            {groupedByDate.map(({ label, items }) => (
              <div key={label}>
                {/* Date group header */}
                <div className="px-4 py-1.5 bg-slate-50 sticky top-0 z-10">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    {label}
                  </span>
                </div>

                {items.map((b) => (
                  <div key={b.id} className="px-4 py-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Team color dot */}
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: b.team?.color ?? '#94a3b8' }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {fmtTime(b.scheduledAt)} · {b.user.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {b.property.nickname} — {b.property.city}
                          </p>
                          {b.team && (
                            <p className="text-[11px] text-slate-400 truncate">
                              {b.team.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-700">
                          {fmt(Number(b.price))}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}
                        >
                          {STATUS_LABELS[b.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
