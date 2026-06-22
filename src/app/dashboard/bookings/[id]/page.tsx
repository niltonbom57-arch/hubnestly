'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import {
  ArrowLeft, MapPin, Clock, Calendar as CalendarIcon,
  Users, AlertTriangle, CheckCircle2, XCircle, Loader2,
  CalendarDays, X,
} from 'lucide-react'
import { toast } from 'sonner'

interface Slot { startUtc: string; endUtc: string; teamId: string }

interface Booking {
  id: string
  status: string
  scheduledAt: string
  estimatedDuration: number
  price: string
  notes?: string | null
  property: { nickname: string; address: string; city: string } | null
  team: { name: string; color: string } | null
}

const STATUS_CONFIG: Record<string, {
  label: string; icon: React.ReactNode
  bg: string; border: string; text: string; dot: string
}> = {
  PENDING:     { label: 'Aguardando pagamento',          icon: <Clock className="w-4 h-4" />,                        bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  PAID:        { label: 'Pago — aguardando confirmação', icon: <CheckCircle2 className="w-4 h-4" />,                  bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  CONFIRMED:   { label: 'Confirmado',                    icon: <CheckCircle2 className="w-4 h-4" />,                  bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
  IN_PROGRESS: { label: 'Em andamento agora',            icon: <Loader2 className="w-4 h-4 animate-spin" />,          bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  COMPLETED:   { label: 'Concluído com sucesso',         icon: <CheckCircle2 className="w-4 h-4" />,                  bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-600',  dot: 'bg-slate-400'  },
  CANCELLED:   { label: 'Cancelado',                     icon: <XCircle className="w-4 h-4" />,                       bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    dot: 'bg-red-400'    },
}

// ─── Modal de Reagendamento ───────────────────────────────────────────────────

interface RescheduleModalProps {
  bookingId: string
  duration: number
  onClose: () => void
  onSuccess: (newDate: string) => void
}

function RescheduleModal({ bookingId, duration, onClose, onSuccess }: RescheduleModalProps) {
  const [date, setDate]         = useState<Date>()
  const [slots, setSlots]       = useState<Slot[]>([])
  const [selected, setSelected] = useState<Slot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, startSave]     = useTransition()

  useEffect(() => {
    if (!date) return
    setSlots([])
    setSelected(null)
    setLoadingSlots(true)
    const dateStr = format(date, 'yyyy-MM-dd')
    fetch(`/api/availability?date=${dateStr}&duration=${duration}`)
      .then((r) => r.json())
      .then((j: { data: Slot[] }) => setSlots(j.data ?? []))
      .finally(() => setLoadingSlots(false))
  }, [date, duration])

  function handleSave() {
    if (!selected) return
    startSave(async () => {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: selected.startUtc, teamId: selected.teamId }),
      })
      if (res.ok) {
        toast.success('Agendamento reagendado com sucesso!')
        onSuccess(selected.startUtc)
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Erro ao reagendar')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            <h2 className="font-extrabold text-slate-900 text-lg">Reagendar limpeza</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-slate-500">
            Escolha a nova data e horário. Os bloqueios de agenda e time serão atualizados automaticamente.
          </p>

          {/* Calendário */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-xl border border-slate-100 p-3"
              disabled={(d) => {
                const day = d.getDay()
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                tomorrow.setHours(0, 0, 0, 0)
                return day === 0 || d < tomorrow
              }}
            />
          </div>

          {/* Slots disponíveis */}
          {date && (
            <div>
              <p className="font-semibold text-slate-700 text-sm mb-3">
                Horários disponíveis em {format(date, "dd 'de' MMMM", { locale: ptBR })}:
              </p>

              {loadingSlots && (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                </div>
              )}

              {!loadingSlots && slots.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">
                  Nenhum horário disponível neste dia. Tente outra data.
                </div>
              )}

              {!loadingSlots && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => {
                    const time = format(new Date(slot.startUtc), 'HH:mm')
                    const isSelected = selected?.startUtc === slot.startUtc
                    return (
                      <button
                        key={slot.startUtc}
                        onClick={() => setSelected(slot)}
                        className={`p-3 rounded-xl text-sm font-semibold border transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-200/60'
                            : 'bg-slate-50 text-slate-700 border-slate-100 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Resumo selecionado */}
          {selected && (
            <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl text-sm">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-teal-700 font-medium">
                Novo horário: {format(new Date(selected.startUtc), "dd/MM/yyyy 'às' HH:mm")}
              </span>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
              disabled={saving}
            >
              Fechar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selected || saving}
              className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reagendando...</>
                : 'Confirmar novo horário'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página de Detalhe ────────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking]               = useState<Booking | null>(null)
  const [loading, setLoading]               = useState(true)
  const [cancelling, startCancel]           = useTransition()
  const [confirmCancel, setConfirmCancel]   = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then((d) => { setBooking(d.booking ?? d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  function handleCancel() {
    if (!confirmCancel) { setConfirmCancel(true); return }
    startCancel(async () => {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' })
      if (res.ok) {
        toast.success('Agendamento cancelado.')
        router.push('/dashboard')
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Erro ao cancelar')
        setConfirmCancel(false)
      }
    })
  }

  function handleRescheduleSuccess(newDate: string) {
    setShowReschedule(false)
    setBooking((prev) => prev ? { ...prev, scheduledAt: newDate } : prev)
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-8 bg-slate-100 rounded-xl w-48" />
        <div className="h-16 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-400 mb-4">Agendamento não encontrado.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard">Voltar ao painel</Link>
        </Button>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG['PENDING']!
  const date  = new Date(booking.scheduledAt)
  const hours = Math.floor(booking.estimatedDuration / 60)
  const mins  = booking.estimatedDuration % 60
  const canAct = ['PENDING', 'CONFIRMED', 'PAID'].includes(booking.status)

  const dateFormatted = date.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/New_York',
  }).replace(/^(\w)/, (c) => c.toUpperCase())

  const timeFormatted = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York',
  })

  return (
    <>
      {showReschedule && (
        <RescheduleModal
          bookingId={id}
          duration={booking.estimatedDuration}
          onClose={() => setShowReschedule(false)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      <div className="max-w-2xl space-y-5">
        {/* Voltar */}
        <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-800 -ml-2 rounded-xl">
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-1.5" />Voltar ao painel</Link>
        </Button>

        <h1 className="text-2xl font-extrabold text-slate-900">Detalhes do agendamento</h1>

        {/* Status banner */}
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
          <div className={`w-2 h-2 rounded-full ${cfg.dot} ${['CONFIRMED', 'IN_PROGRESS'].includes(booking.status) ? 'animate-pulse' : ''}`} />
          <span className={`font-semibold ${cfg.text} flex items-center gap-2`}>
            {cfg.icon}{cfg.label}
          </span>
        </div>

        {/* Card principal */}
        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white">
            <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest mb-1">Imóvel</p>
            <p className="text-xl font-extrabold">{booking.property?.nickname ?? 'Imóvel'}</p>
            <p className="text-teal-100 text-sm mt-1">{booking.property?.address}, {booking.property?.city}, FL</p>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{dateFormatted}</p>
                  <p className="text-sm text-slate-500">às {timeFormatted} (Eastern Time)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Duração estimada</p>
                    <p className="font-bold text-slate-900">{hours}h{mins > 0 ? ` ${mins}min` : ''}</p>
                  </div>
                </div>

                {booking.team && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Equipe</p>
                      <p className="font-bold text-slate-900">{booking.team.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {booking.notes && (
              <>
                <Separator />
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Observações</p>
                  <p className="text-sm text-slate-700">{booking.notes}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Valor total</p>
                <p className="text-xs text-slate-400">Processado via Stripe</p>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-300" />
                <p className="text-3xl font-black text-teal-600">
                  ${parseFloat(booking.price).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de ações: reagendar + cancelar */}
        {canAct && (
          <Card className="border-slate-100 rounded-2xl">
            <CardContent className="p-5 space-y-4">

              {/* Reagendar */}
              {!confirmCancel && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700 text-sm">Precisa mudar a data?</p>
                    <p className="text-xs text-slate-400 mt-0.5">Escolha um novo dia e horário disponível.</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shrink-0"
                    onClick={() => setShowReschedule(true)}
                  >
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                    Reagendar
                  </Button>
                </div>
              )}

              {!confirmCancel && <div className="h-px bg-slate-100" />}

              {/* Cancelar */}
              {confirmCancel ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700 text-sm">Tem certeza que deseja cancelar?</p>
                      <p className="text-xs text-red-500 mt-1">Esta ação não pode ser desfeita. O agendamento será cancelado definitivamente.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="rounded-xl"
                    >
                      {cancelling
                        ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Cancelando...</>
                        : 'Sim, cancelar agendamento'
                      }
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmCancel(false)}
                      className="rounded-xl"
                    >
                      Manter agendamento
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700 text-sm">Deseja cancelar?</p>
                    <p className="text-xs text-slate-400 mt-0.5">O agendamento será removido definitivamente.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-xl shrink-0"
                    onClick={handleCancel}
                  >
                    Cancelar agendamento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
