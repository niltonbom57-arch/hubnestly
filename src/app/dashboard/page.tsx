import { auth } from '@/lib/auth/session'
import { findBookingsByUser } from '@/lib/repositories/booking-repository'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookingCard } from '@/components/dashboard/booking-card'
import Link from 'next/link'
import { Calendar, Plus, CheckCircle2, DollarSign, Clock, Sparkles, ArrowRight } from 'lucide-react'
import { formatEt } from '@/lib/scheduling/timezone'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const bookings = await findBookingsByUser(session.user.id)
  const upcoming = bookings.filter((b) => ['CONFIRMED', 'PAID', 'IN_PROGRESS', 'PENDING'].includes(b.status))
  const past = bookings.filter((b) => ['COMPLETED', 'CANCELLED'].includes(b.status)).slice(0, 5)
  const completed = bookings.filter((b) => b.status === 'COMPLETED')
  const totalSpent = completed.reduce((sum, b) => sum + parseFloat(b.price.toString()), 0)
  const nextBooking = upcoming.find((b) => ['CONFIRMED', 'PAID'].includes(b.status))

  const firstName = session.user.name?.split(' ')[0] ?? 'Olá'

  return (
    <div className="space-y-8">

      {/* ── Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {upcoming.length > 0
              ? `Você tem ${upcoming.length} agendamento${upcoming.length > 1 ? 's' : ''} futuro${upcoming.length > 1 ? 's' : ''}.`
              : 'Nenhum agendamento futuro. Que tal agendar agora?'}
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shrink-0"
          asChild
        >
          <Link href="/dashboard/bookings/new">
            <Plus className="w-4 h-4 mr-2" />Novo agendamento
          </Link>
        </Button>
      </div>

      {/* ── Próxima limpeza destaque ──────────── */}
      {nextBooking && (
        <div className="relative overflow-hidden rounded-2xl gradient-gleam p-6 sm:p-8 text-white">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">Próxima limpeza</span>
            </div>
            <p className="text-2xl font-extrabold mb-1">{nextBooking.property?.nickname ?? 'Imóvel'}</p>
            <p className="text-white/80 mb-1">
              {nextBooking.property?.address} · {nextBooking.property?.city}
            </p>
            <p className="text-white/70 text-sm">
              {formatEt(nextBooking.scheduledAt, "EEEE',' dd 'de' MMMM 'às' HH:mm")} (ET)
            </p>
            <div className="flex items-center gap-3 mt-5">
              <Button
                size="sm"
                className="bg-white text-teal-700 hover:bg-white/90 rounded-xl font-semibold h-9"
                asChild
              >
                <Link href={`/dashboard/bookings/${nextBooking.id}`}>
                  Ver detalhes <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
              <span className="text-white font-bold text-lg">
                ${parseFloat(nextBooking.price.toString()).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: <Calendar className="w-5 h-5 text-teal-600" />,
            bg: 'bg-teal-50',
            value: bookings.length,
            label: 'Total de limpezas',
          },
          {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
            bg: 'bg-emerald-50',
            value: completed.length,
            label: 'Concluídas',
          },
          {
            icon: <DollarSign className="w-5 h-5 text-amber-600" />,
            bg: 'bg-amber-50',
            value: `$${totalSpent.toFixed(0)}`,
            label: 'Total investido',
          },
        ].map((s) => (
          <Card key={s.label} className="border-slate-100">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Upcoming bookings ────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" /> Agendamentos futuros
          </h2>
        </div>

        {upcoming.length === 0 ? (
          <Card className="border-dashed border-slate-200">
            <CardContent className="py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-teal-400" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">Nenhum agendamento futuro</p>
              <p className="text-sm text-slate-400 mb-5">Agende uma limpeza e mantenha seu lar sempre impecável.</p>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl" asChild>
                <Link href="/dashboard/bookings/new">Agendar agora</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </section>

      {/* ── History ──────────────────────────── */}
      {past.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" /> Histórico recente
          </h2>
          <div className="space-y-3">
            {past.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        </section>
      )}
    </div>
  )
}
