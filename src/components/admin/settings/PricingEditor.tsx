'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { calculatePrice } from '@/lib/pricing/calculate-price'
import type { TenantSettings } from '@prisma/client'

type PricingFields = {
  basePrice: number
  pricePerBedroom: number
  pricePerBathroom: number
  priceLaundry: number
  priceExtraRoom: number
  priceGarage: number
  pricePool: number
  pricePatio: number
  baseDurationMinutes: number
  durationPerBedroom: number
  durationPerBathroom: number
}

interface Props {
  tenantSlug: string
  initialSettings: TenantSettings | null
}

export function PricingEditor({ tenantSlug, initialSettings }: Props) {
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, watch } = useForm<PricingFields>({
    defaultValues: {
      basePrice:           Number(initialSettings?.basePrice        ?? 35),
      pricePerBedroom:     Number(initialSettings?.pricePerBedroom  ?? 25),
      pricePerBathroom:    Number(initialSettings?.pricePerBathroom ?? 20),
      priceLaundry:        Number(initialSettings?.priceLaundry     ?? 20),
      priceExtraRoom:      Number(initialSettings?.priceExtraRoom   ?? 15),
      priceGarage:         Number(initialSettings?.priceGarage      ?? 30),
      pricePool:           Number(initialSettings?.pricePool        ?? 35),
      pricePatio:          Number(initialSettings?.pricePatio       ?? 25),
      baseDurationMinutes: initialSettings?.baseDurationMinutes     ?? 90,
      durationPerBedroom:  initialSettings?.durationPerBedroom      ?? 30,
      durationPerBathroom: initialSettings?.durationPerBathroom     ?? 20,
    },
  })

  const values = watch()

  // Preview com 3 quartos / 2 banheiros
  const preview = calculatePrice(
    { bedrooms: 3, bathrooms: 2, hasLaundry: false, extraRooms: 0, hasGarage: false, hasPool: false, hasPatio: false },
    values,
  )
  const previewDuration = (values.baseDurationMinutes ?? 90) + 3 * (values.durationPerBedroom ?? 30) + 2 * (values.durationPerBathroom ?? 20)
  const previewHours = Math.floor(previewDuration / 60)
  const previewMins  = previewDuration % 60

  async function onSubmit(data: PricingFields) {
    setSaving(true)
    try {
      const res = await fetch(`/api/t/${tenantSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error ?? 'Erro ao salvar'); return }
      toast.success('Preços atualizados!')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Preview ao vivo */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700 font-medium mb-2">Preview — Casa 3 quartos / 2 banheiros</p>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold text-blue-700">${preview.total}</span>
            <span className="text-sm text-blue-600">{previewHours}h{previewMins > 0 ? ` ${previewMins}min` : ''} de serviço</span>
          </div>
        </CardContent>
      </Card>

      {/* Preços */}
      <div>
        <h3 className="font-semibold mb-3">Tabela de preços</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Preço base', field: 'basePrice' as const, prefix: '$' },
            { label: 'Por quarto', field: 'pricePerBedroom' as const, prefix: '$' },
            { label: 'Por banheiro', field: 'pricePerBathroom' as const, prefix: '$' },
            { label: 'Lavanderia', field: 'priceLaundry' as const, prefix: '$' },
            { label: 'Sala extra/escritório', field: 'priceExtraRoom' as const, prefix: '$' },
            { label: 'Garagem', field: 'priceGarage' as const, prefix: '$' },
            { label: 'Piscina', field: 'pricePool' as const, prefix: '$' },
            { label: 'Pátio/área externa', field: 'pricePatio' as const, prefix: '$' },
          ].map(({ label, field, prefix }) => (
            <div key={field} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <div className="flex items-center">
                <span className="bg-gray-100 border border-r-0 rounded-l-md px-2 py-2 text-sm">{prefix}</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="rounded-l-none"
                  {...register(field, { valueAsNumber: true })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Duração */}
      <div>
        <h3 className="font-semibold mb-3">Duração estimada do serviço</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Base (min)', field: 'baseDurationMinutes' as const },
            { label: 'Por quarto (min)', field: 'durationPerBedroom' as const },
            { label: 'Por banheiro (min)', field: 'durationPerBathroom' as const },
          ].map(({ label, field }) => (
            <div key={field} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input type="number" min="0" {...register(field, { valueAsNumber: true })} />
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Salvando...' : 'Salvar preços'}
      </Button>
    </form>
  )
}
