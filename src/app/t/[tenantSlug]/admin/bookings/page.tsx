import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import {
  CalendarDays, Clock, MapPin, User, DollarSign,
  Users2, Package, ChevronLeft, ChevronRight,
  CalendarOff,
} from 'lucide-react'
import { BookingActions } from './BookingActions'

// ─── Types ───────────────────────────────────────────────────────────────────

type BookingStatus =
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

interface AddOn {
  addOn: { name: string; price: string | number }
}

interface BookingRow {
  id: string
  scheduledAt: Date
  estimatedDuration: number
  price: string | number
  status: string
  notes: string | null
  user: { id: string; name: string | null; email: string; phone: string | null }
  property: {
    id: string
    nickname: string
    address: string
    city: string
    bedrooms: number
    bathrooms: number
  }
  team: { id: string; name: string; color: string } | null
  bookingAddOns: AddOn[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function fmtDateTime(d: Date) {
  return d.toLocaleString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

function fmtDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
  PAID: 'bg-blue-100 text-blue-700 border border-blue-200',
  CONFIRMED: 'bg-teal-100 text-teal-700 border border-teal-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-700 border border-purple-200',
  COMPLETED: 'bg-green-100 text-green-700 border border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
}

const ALL_STATUSES: BookingStatus[] = [
  'PENDING', 'PAID', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
]

// ─── Month nav helpers ────────────────────────────────────────────────────────

function prevMonth(ym: string) {
  const [y = 0, m = 1] = ym.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(ym: string) {
  const [y = 0, m = 1] = ym.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmtMonthLabel(ym: string) {
  const [y = 0, m = 1] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
}

function currentYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface Props {
  params: { tenantSlug: string }
  searchParams: { status?: string; month?: string }
}

export default async function AdminBookingsPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as
    | { tenantId?: string; role?: string }
    | undefined

  if (!session) notFound()

  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant) notFound()

  if (sessionUser?.tenantId !== tenant.id || sessionUser?.role !== 'ADMIN') {
    notFound()
  }

  // ── Filtros ────────────────────────────────────────────────────────────────

  const activeStatus = ALL_STATUSES.includes(searchParams.status as BookingStatus)
    ? (searchParams.status as BookingStatus)
    : null

  const activeMonth = /^\d{4}-\d{2}$/.test(searchParams.month ?? '')
    ? (searchParams.month as string)
    : currentYearMonth()

  const [year = 0, month = 1] = activeMonth.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 1)

  // ── Query ──────────────────────────────────────────────────────────────────

  const bookings = await prisma.booking.findMany({
    where: {
      tenantId: tenant.id,
      ...(activeStatus ? { status: activeStatus } : {}),
      scheduledAt: { gte: monthStart, lt: monthEnd },
    },
    orderBy: { scheduledAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      property: {
        select: {
          id: true, nickname: true, address: true, city: true,
          bedrooms: true, bathrooms: true,
        },
      },
      team: { select: { id: true, name: true, color: true } },
      bookingAddOns: { include: { addOn: { select: { name: true, price: true } } } },
    },
  }) as unknown as BookingRow[]

  const totalRevenue = bookings
    .filter(b => b.status !== 'CANCELLED' && b.status !== 'PENDING')
    .reduce((acc, b) => acc + Number(b.price), 0)

  const baseUrl = `/t/${params.tenantSlug}/admin/bookings`

  function statusLink(s: BookingStatus | null) {
    const p = new URLSearchParams()
    if (s) p.set('status', s)
    p.set('month', activeMonth)
    return `${baseUrl}?${p.toString()}`
  }

  function monthLink(ym: string) {
    const p = new URLSearchParams()
    if (activeStatus) p.set('status', activeStatus)
    p.set('month', ym)
    return `${baseUrl}?${p.toString()}`
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Agendamentos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {bookings.length} agendamento{bookings.length !== 1 ? 's' : ''} em{' '}
            <span className="font-semibold text-slate-700">{fmtMonthLabel(activeMonth)}</span>
          </p>
        </div>

        {/* Receita filtrada */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
            <DollarSign className="w-4.5 h-4.5 text-teal-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Receita filtrada</p>
            <p className="text-lg font-extrabold text-teal-700">{fmt(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">

        {/* Navegação de mês */}
        <div className="flex items-center gap-2">
          <Link
            href={monthLink(prevMonth(activeMonth))}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center capitalize">
            {fmtMonthLabel(activeMonth)}
          </span>
          <Link
            href={monthLink(nextMonth(activeMonth))}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </Link>
        </div>

        {/* Filtros de status */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={statusLink(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              !activeStatus
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </Link>
          {ALL_STATUSES.map(s => (
            <Link
              key={s}
              href={statusLink(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeStatus === s
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      {bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              tenantSlug={params.tenantSlug}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  tenantSlug,
}: {
  booking: BookingRow
  tenantSlug: string
}) {
  const price = Number(booking.price)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Top row */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">

        {/* Left: info */}
        <div className="space-y-3">

          {/* Date + status + duration */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-sm">
              <CalendarDays className="w-4 h-4 text-teal-500 shrink-0" />
              {fmtDateTime(booking.scheduledAt)}
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_CLASSES[booking.status] ?? ''}`}>
              {STATUS_LABELS[booking.status] ?? booking.status}
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Clock className="w-3.5 h-3.5" />
              {fmtDuration(booking.estimatedDuration)}
            </div>
          </div>

          {/* Cliente */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">{booking.user.name ?? '—'}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{booking.user.email}</span>
            {booking.user.phone && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{booking.user.phone}</span>
              </>
            )}
          </div>

          {/* Endereço */}
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-slate-700">{booking.property.nickname}</span>
              {' · '}
              {booking.property.address}, {booking.property.city}
              <span className="text-slate-400 ml-2 text-xs">
                {booking.property.bedrooms} quartos · {booking.property.bathrooms} banheiros
              </span>
            </div>
          </div>

          {/* Time */}
          {booking.team && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: booking.team.color }}
              />
              <span className="font-medium">{booking.team.name}</span>
            </div>
          )}
        </div>

        {/* Right: price */}
        <div className="flex flex-col items-end justify-between gap-3">
          <div className="text-right">
            <p className="text-2xl font-extrabold text-slate-800">{fmt(price)}</p>
            {booking.bookingAddOns.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 justify-end">
                <Package className="w-3 h-3" />
                {booking.bookingAddOns.length} add-on{booking.bookingAddOns.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions (Client Component) */}
      <BookingActions
        bookingId={booking.id}
        tenantSlug={tenantSlug}
        status={booking.status as BookingStatus}
        notes={booking.notes}
        addOns={booking.bookingAddOns.map(a => ({
          name: a.addOn.name,
          price: Number(a.addOn.price),
        }))}
      />
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 flex flex-col items-center justify-center gap-3 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-1">
        <CalendarOff className="w-7 h-7 text-slate-400" />
      </div>
      <p className="text-slate-700 font-semibold text-base">Nenhum agendamento encontrado</p>
      <p className="text-slate-400 text-sm max-w-xs">
        Tente ajustar os filtros de status ou navegar para um mês diferente.
      </p>
    </div>
  )
}
