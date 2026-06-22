'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { TenantSettings } from '@prisma/client'

type BrandingFields = {
  logoUrl: string
  primaryColor: string
  supportEmail: string
  supportPhone: string
}

interface Props {
  tenantSlug: string
  initialSettings: TenantSettings | null
  tenantName: string
}

export function BrandingForm({ tenantSlug, initialSettings, tenantName }: Props) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, watch } = useForm<BrandingFields>({
    defaultValues: {
      logoUrl:      initialSettings?.logoUrl      ?? '',
      primaryColor: initialSettings?.primaryColor ?? '#0ea5e9',
      supportEmail: initialSettings?.supportEmail ?? '',
      supportPhone: initialSettings?.supportPhone ?? '',
    },
  })

  const primaryColor = watch('primaryColor')

  async function onSubmit(data: BrandingFields) {
    setSaving(true)
    try {
      const res = await fetch(`/api/t/${tenantSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error ?? 'Erro ao salvar'); return }
      toast.success('Configurações salvas!')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Preview mini */}
      <div
        className="rounded-lg p-4 text-white font-semibold text-lg flex items-center gap-3"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
          {tenantName[0]?.toUpperCase()}
        </div>
        {tenantName}
      </div>

      <div className="space-y-1">
        <Label>URL do logo</Label>
        <Input placeholder="https://..." {...register('logoUrl')} />
        <p className="text-xs text-gray-400">Link direto para a imagem (PNG ou SVG recomendado)</p>
      </div>

      <div className="space-y-1">
        <Label>Cor principal</Label>
        <div className="flex gap-3 items-center">
          <input type="color" {...register('primaryColor')} className="h-10 w-16 rounded border cursor-pointer" />
          <Input {...register('primaryColor')} placeholder="#0ea5e9" className="font-mono" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Email de suporte</Label>
        <Input type="email" placeholder="contato@suaempresa.com" {...register('supportEmail')} />
      </div>

      <div className="space-y-1">
        <Label>Telefone de contato</Label>
        <Input placeholder="(239) 555-0100" {...register('supportPhone')} />
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Salvando...' : 'Salvar branding'}
      </Button>
    </form>
  )
}
