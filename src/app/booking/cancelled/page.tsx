import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, Home } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function BookingCancelledPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <Link
        href="/"
        className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Página inicial
      </Link>
      <div className="absolute top-5 right-5">
        <LanguageSwitcher variant="light" />
      </div>

      <div className="text-center max-w-md space-y-5">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Pagamento cancelado</h1>
        <p className="text-slate-500 leading-relaxed">
          Seu pagamento foi cancelado e o agendamento não foi confirmado. Não se preocupe — nenhuma
          cobrança foi feita. Tente novamente quando quiser.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
            <Link href="/dashboard/bookings/new">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/">
              <Home className="w-4 h-4 mr-1.5" /> Página inicial
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
