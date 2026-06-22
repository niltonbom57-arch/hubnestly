import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Calendar, MapPin, Clock, DollarSign, ArrowRight, Home } from 'lucide-react'
import { findBookingBySessionId } from '@/lib/repositories/booking-repository'
import { auth } from '@/lib/auth/session'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

interface Props {
  searchParams: { session_id?: string }
}

async function SuccessContent({ sessionId }: { sessionId: string }) {
  const booking = await findBookingBySessionId(sessionId)

  if (!booking) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold">Pagamento confirmado!</h1>
        <p className="text-gray-600">Seu agendamento foi confirmado. Você receberá um email em breve.</p>
        <Button asChild>
          <Link href="/dashboard">Ver meus agendamentos</Link>
        </Button>
      </div>
    )
  }

  const date = new Date(booking.scheduledAt)
  const hours = Math.floor(booking.estimatedDuration / 60)
  const mins = booking.estimatedDuration % 60
  const dateFormatted = date.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/New_York',
  })
  const timeFormatted = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York',
  })

  return (
    <div className="text-center space-y-6 max-w-lg w-full">
      {/* Checkmark animado */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pagamento confirmado!</h1>
        <p className="text-gray-500 mt-2">Seu agendamento está confirmado. Até lá! 🧹</p>
      </div>

      {/* Detalhes do agendamento */}
      <Card className="text-left border-green-100 bg-green-50/30">
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Detalhes do agendamento</h2>

          <div className="space-y-3 text-sm">
            {booking.property && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{booking.property.nickname}</p>
                  <p className="text-gray-500">{booking.property.address} · {booking.property.city}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="font-medium capitalize">{dateFormatted}</p>
                <p className="text-gray-500">às {timeFormatted} (Eastern Time)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <p>Duração estimada: <span className="font-medium">{hours}h{mins > 0 ? ` ${mins}min` : ''}</span></p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-green-100">
              <span className="text-gray-600">Total pago</span>
              <span className="text-xl font-bold text-green-700 flex items-center gap-0.5">
                <DollarSign className="w-5 h-5" />{parseFloat(booking.price.toString()).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href="/dashboard">
            Ver meus agendamentos <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/bookings/new">Agendar novamente</Link>
        </Button>
      </div>
    </div>
  )
}

export default async function BookingSuccessPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4 relative">
      <Link
        href="/"
        className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <Home className="w-4 h-4" /> Página inicial
      </Link>
      <div className="absolute top-5 right-5">
        <LanguageSwitcher variant="light" />
      </div>
      <Suspense fallback={
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse mx-auto" />
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
        </div>
      }>
        {searchParams.session_id ? (
          <SuccessContent sessionId={searchParams.session_id} />
        ) : (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-3xl font-bold">Pagamento confirmado!</h1>
            <Button asChild><Link href="/dashboard">Ver meus agendamentos</Link></Button>
          </div>
        )}
      </Suspense>
    </div>
  )
}
