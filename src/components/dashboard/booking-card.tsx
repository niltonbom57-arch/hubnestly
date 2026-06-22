import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatEt } from '@/lib/scheduling/timezone'
import { MapPin, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, {
  label: string
  dot: string
  badge: 'default' | 'secondary' | 'destructive' | 'outline'
  pulse?: boolean
}> = {
  PENDING:     { label: 'Aguardando pagamento', dot: 'bg-amber-400', badge: 'outline', pulse: true },
  PAID:        { label: 'Pago',                dot: 'bg-blue-500',  badge: 'secondary' },
  CONFIRMED:   { label: 'Confirmado',           dot: 'bg-teal-500', badge: 'default', pulse: true },
  IN_PROGRESS: { label: 'Em andamento',         dot: 'bg-purple-500', badge: 'secondary', pulse: true },
  COMPLETED:   { label: 'Concluído',            dot: 'bg-slate-400', badge: 'secondary' },
  CANCELLED:   { label: 'Cancelado',            dot: 'bg-red-400',  badge: 'destructive' },
}

interface BookingCardProps {
  booking: {
    id: string
    status: string
    scheduledAt: Date
    estimatedDuration: number
    price: { toString(): string }
    property: { nickname: string; address: string; city: string } | null
  }
}

export function BookingCard({ booking }: BookingCardProps) {
  const cfg = STATUS_CONFIG[booking.status] ?? { label: booking.status, dot: 'bg-slate-400', badge: 'outline' as const }
  const dateFormatted = formatEt(booking.scheduledAt, "EEE',' dd MMM 'às' HH:mm")
  const hours = Math.floor(booking.estimatedDuration / 60)
  const mins = booking.estimatedDuration % 60
  const isCancelled = booking.status === 'CANCELLED'

  return (
    <Link href={`/dashboard/bookings/${booking.id}`}>
      <Card className={`card-hover cursor-pointer border-slate-100 ${isCancelled ? 'opacity-60' : ''}`}>
        <CardContent className="p-5 flex items-center gap-4">
          {/* Status dot */}
          <div className="shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="font-semibold text-slate-900 truncate">{booking.property?.nickname ?? 'Imóvel'}</p>
              <Badge variant={cfg.badge} className="text-[10px] shrink-0">{cfg.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{dateFormatted}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{booking.property?.city ?? '-'}
              </span>
            </div>
          </div>

          {/* Price + duration */}
          <div className="text-right shrink-0">
            <p className="font-bold text-teal-600 text-lg leading-none">
              ${parseFloat(booking.price.toString()).toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {hours}h{mins > 0 ? ` ${mins}min` : ''}
            </p>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}
