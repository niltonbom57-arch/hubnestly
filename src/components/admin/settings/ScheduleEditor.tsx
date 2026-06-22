'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { TenantSettings } from '@prisma/client'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type ScheduleFields = {
  startHour: number
  endHour: number
  minAdvanceHours: number
  travelBlockMinutes: number
  cities: string
  timezone: string
}

const AVAILABLE_CITIES = ['Fort Myers', 'Naples', 'Bonita Springs', 'Lehigh Acres', 'Cape Coral', 'Marco Island']

interface Props {
  tenantSlug: string
  initialSettings: TenantSettings | null
}

export function ScheduleEditor({ tenantSlug, initialSettings }: Props) {
  const [saving, setSaving] = useState(false)
  const [workDays, setWorkDays] = useState<number[]>(initialSettings?.workDays ?? [1, 2, 3, 4, 5, 6])
  const [selectedCities, setSelectedCities] = useState<string[]>(initialSettings?.cities ?? [])

  const { register, handleSubmit } = useForm<ScheduleFields>({
    defaultValues: {
      startHour:          initialSettings?.startHour          ?? 8,
      endHour:            initialSettings?.endHour            ?? 18,
      minAdvanceHours:    initialSettings?.minAdvanceHours    ?? 24,
      travelBlockMinutes: initialSettings?.travelBlockMinutes ?? 40,
      timezone:           initialSettings?.timezone           ?? 'America/New_York',
    },
  })

  function toggleDay(day: number) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    )
  }

  function toggleCity(city: string) {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    )
  }

  async function onSubmit(data: ScheduleFields) {
    setSaving(true)
    try {
      const res = await fetch(`/api/t/${tenantSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, workDays, cities: selectedCities }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error ?? 'Erro ao salvar'); return }
      toast.success('Horários atualizados!')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dias de funcionamento */}
      <div className="space-y-2">
        <Label>Dias de atendimento</Label>
        <div className="flex gap-2">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors
                ${workDays.includes(i)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Horários */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Início (hora)</Label>
          <Input type="number" min={0} max={23} {...register('startHour', { valueAsNumber: true })} />
          <p className="text-xs text-gray-400">Ex: 8 = 08:00</p>
        </div>
        <div className="space-y-1">
          <Label>Encerramento (hora)</Label>
          <Input type="number" min={1} max={24} {...register('endHour', { valueAsNumber: true })} />
          <p className="text-xs text-gray-400">Ex: 18 = 18:00</p>
        </div>
        <div className="space-y-1">
          <Label>Antecedência mínima (horas)</Label>
          <Input type="number" min={0} {...register('minAdvanceHours', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1">
          <Label>Bloco de deslocamento (min)</Label>
          <Input type="number" min={0} {...register('travelBlockMinutes', { valueAsNumber: true })} />
        </div>
      </div>

      {/* Cidades */}
      <div className="space-y-2">
        <Label>Cidades atendidas</Label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => toggleCity(city)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                ${selectedCities.includes(city)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Salvando...' : 'Salvar horários'}
      </Button>
    </form>
  )
}
