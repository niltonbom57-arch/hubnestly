'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BookingDraft } from '@/app/dashboard/bookings/new/page'
import { CreditCard, Loader2, Shield, ChevronLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface StepPaymentProps {
  draft: BookingDraft
  onBack: () => void
}

export function StepPayment({ draft, onBack }: StepPaymentProps) {
  const [loading, setLoading] = useState(false)
  const scheduledDate = new Date(draft.scheduledAt)
  const hours = Math.floor(draft.duration / 60)
  const mins = draft.duration % 60

  async function handlePay() {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: draft.propertyId,
          scheduledAt: draft.scheduledAt,
          teamId: draft.teamId,
          addOnIds: draft.addOnIds ?? [],
        }),
      })
      const json: { success: boolean; data?: { checkoutUrl: string }; error?: string } = await res.json()

      if (!json.success || !json.data?.checkoutUrl) {
        toast.error(json.error ?? 'Erro ao criar agendamento')
        return
      }

      window.location.href = json.data.checkoutUrl
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Revisar e pagar</h2>
        <p className="text-slate-500 text-sm mt-1">Confira os detalhes antes de confirmar.</p>
      </div>

      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-0.5">Resumo do agendamento</p>
          <p className="text-white font-bold">{draft.propertyNickname}</p>
        </div>

        <CardContent className="p-5 space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Data e hora</span>
            <span className="font-semibold text-slate-800">
              {format(scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} (ET)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Duração estimada</span>
            <span className="font-semibold text-slate-800">
              {hours}h{mins > 0 ? ` ${mins}min` : ''}
            </span>
          </div>

          <Separator />

          {/* Base price */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Limpeza padrão</span>
            <span className="font-semibold text-slate-800">${(draft.basePrice ?? draft.price).toFixed(2)}</span>
          </div>

          {/* Add-ons */}
          {draft.addOnIds && draft.addOnIds.length > 0 && draft.addOnTotal > 0 && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Serviços adicionais
                </p>
                {/* Aqui mostramos os nomes via addOnTotal — os nomes viriam do step anterior mas não temos no draft */}
                <div className="flex justify-between items-center pl-2">
                  <span className="text-slate-500">{draft.addOnIds.length} serviço{draft.addOnIds.length > 1 ? 's' : ''} adicional{draft.addOnIds.length > 1 ? 'is' : ''}</span>
                  <span className="font-semibold text-teal-600">+${draft.addOnTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-between items-center pt-1">
            <span className="font-bold text-slate-900 text-base">Total</span>
            <span className="text-2xl font-black text-teal-600">${draft.price.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stripe trust */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <Shield className="w-5 h-5 text-teal-600 shrink-0" />
        <p className="text-xs text-slate-500">
          Você será redirecionado ao <strong>Stripe</strong> para pagamento seguro.
          O agendamento só é confirmado após a conclusão do pagamento.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="rounded-xl border-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={handlePay}
          disabled={loading}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold h-12 text-base shadow-md shadow-teal-200"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Aguarde...</>
            : <><CreditCard className="w-4 h-4 mr-2" />Pagar ${draft.price.toFixed(2)}</>
          }
        </Button>
      </div>
    </div>
  )
}
