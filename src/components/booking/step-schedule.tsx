'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookingDraft } from '@/app/dashboard/bookings/new/page'
import { Loader2 } from 'lucide-react'

interface Slot {
  startUtc: string
  endUtc: string
  teamId: string
}

interface StepScheduleProps {
  duration: number
  onNext: (data: Pick<BookingDraft, 'scheduledAt' | 'teamId'>) => void
  onBack: () => void
}

export function StepSchedule({ duration, onNext, onBack }: StepScheduleProps) {
  const [date, setDate] = useState<Date>()
  const [slots, setSlots] = useState<Slot[]>([])
  const [selected, setSelected] = useState<Slot | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!date) return
    setSlots([])
    setSelected(null)
    setLoading(true)

    const dateStr = format(date, 'yyyy-MM-dd')
    fetch(`/api/availability?date=${dateStr}&duration=${duration}`)
      .then((r) => r.json())
      .then((j: { data: Slot[] }) => setSlots(j.data ?? []))
      .finally(() => setLoading(false))
  }, [date, duration])

  function handleNext() {
    if (!selected) return
    onNext({ scheduledAt: selected.startUtc, teamId: selected.teamId })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Escolha a data e o horário</h2>

      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={ptBR}
          disabled={(d) => {
            const day = d.getDay()
            const isPast = d < new Date()
            return day === 0 || isPast
          }}
        />
      </div>

      {date && (
        <div>
          <p className="font-medium mb-3">Horários disponíveis em {format(date, "dd 'de' MMMM", { locale: ptBR })}:</p>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}

          {!loading && slots.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum horário disponível neste dia.</p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => {
              const time = format(new Date(slot.startUtc), 'HH:mm')
              const isSelected = selected?.startUtc === slot.startUtc
              return (
                <Card
                  key={slot.startUtc}
                  className={`cursor-pointer text-center ${isSelected ? 'ring-2 ring-blue-600 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelected(slot)}
                >
                  <CardContent className="p-3">
                    <p className="font-medium">{time}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Voltar</Button>
        <Button onClick={handleNext} disabled={!selected} className="flex-1">
          Próximo: revisar e pagar
        </Button>
      </div>
    </div>
  )
}
