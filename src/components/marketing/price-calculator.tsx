'use client'

import { useState } from 'react'
import { calculatePrice } from '@/lib/pricing/calculate-price'
import { calculateDuration } from '@/lib/pricing/calculate-duration'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function PriceCalculator() {
  const [form, setForm] = useState({
    bedrooms: 3,
    bathrooms: 2,
    hasLaundry: false,
    extraRooms: 0,
    hasGarage: false,
    hasPool: false,
    hasPatio: false,
  })

  const breakdown = calculatePrice(form)
  const duration = calculateDuration(form)
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  function setNum(field: 'bedrooms' | 'bathrooms' | 'extraRooms', value: string) {
    const n = Math.max(0, parseInt(value) || 0)
    setForm((prev) => ({ ...prev, [field]: n }))
  }

  function toggleBool(field: 'hasLaundry' | 'hasGarage' | 'hasPool' | 'hasPatio') {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de preço</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Quartos</Label>
            <Input type="number" min={1} max={10} value={form.bedrooms} onChange={(e) => setNum('bedrooms', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Banheiros</Label>
            <Input type="number" min={1} max={10} value={form.bathrooms} onChange={(e) => setNum('bathrooms', e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Salas extras / escritório</Label>
          <Input type="number" min={0} max={5} value={form.extraRooms} onChange={(e) => setNum('extraRooms', e.target.value)} />
        </div>

        <div className="space-y-3">
          {([
            { field: 'hasLaundry', label: 'Lavanderia (+$20)' },
            { field: 'hasGarage', label: 'Garagem (+$30)' },
            { field: 'hasPool', label: 'Área da piscina (+$35)' },
            { field: 'hasPatio', label: 'Pátio / área externa (+$25)' },
          ] as const).map(({ field, label }) => (
            <div key={field} className="flex items-center justify-between">
              <Label>{label}</Label>
              <Switch checked={form[field]} onCheckedChange={() => toggleBool(field)} />
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Base</span><span>${breakdown.base}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{form.bedrooms} quartos</span><span>${breakdown.bedrooms}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{form.bathrooms} banheiros</span><span>${breakdown.bathrooms}</span>
          </div>
          {breakdown.laundry > 0 && <div className="flex justify-between text-gray-600"><span>Lavanderia</span><span>${breakdown.laundry}</span></div>}
          {breakdown.offices > 0 && <div className="flex justify-between text-gray-600"><span>Escritórios</span><span>${breakdown.offices}</span></div>}
          {breakdown.garages > 0 && <div className="flex justify-between text-gray-600"><span>Garagem</span><span>${breakdown.garages}</span></div>}
          {breakdown.pool > 0 && <div className="flex justify-between text-gray-600"><span>Piscina</span><span>${breakdown.pool}</span></div>}
          {breakdown.patio > 0 && <div className="flex justify-between text-gray-600"><span>Pátio</span><span>${breakdown.patio}</span></div>}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span><span className="text-blue-600">${breakdown.total}</span>
          </div>
          <p className="text-gray-500 text-xs">Duração estimada: {hours}h{minutes > 0 ? ` ${minutes}min` : ''}</p>
        </div>

        <Button className="w-full" asChild>
          <Link href="/auth/register">Agendar esta limpeza</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
