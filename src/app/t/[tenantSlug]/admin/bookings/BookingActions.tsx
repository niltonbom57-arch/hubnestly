'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2, Package, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ───────────────────────────────────────────────────────────────────

type BookingStatus =
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

interface AddOnItem {
  name: string
  price: number
}

interface Props {
  bookingId: string
  tenantSlug: string
  status: BookingStatus
  notes: string | null
  addOns: AddOnItem[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BookingActions({ bookingId, tenantSlug, status, notes, addOns }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading]   = useState<'confirm' | 'cancel' | null>(null)
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>(status)
  const [error, setError] = useState<string | null>(null)

  const canConfirm = currentStatus === 'PAID'
  const canCancel  = currentStatus === 'PAID' || currentStatus === 'CONFIRMED'

  async function handleAction(action: 'confirm' | 'cancel') {
    setLoading(action)
    setError(null)

    try {
      const res = await fetch(
        `/api/t/${tenantSlug}/admin/bookings/${bookingId}/${action}`,
        { method: 'PATCH' },
      )

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Erro inesperado')
      }

      setCurrentStatus(action === 'confirm' ? 'CONFIRMED' : 'CANCELLED')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar ação')
    } finally {
      setLoading(null)
    }
  }

  const hasDetails = addOns.length > 0 || !!notes

  return (
    <div className="border-t border-slate-100">
      <div className="px-5 py-3 flex flex-wrap items-center gap-2">

        {/* Ver detalhes */}
        {hasDetails && (
          <button
            onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
          </button>
        )}

        <div className="flex-1" />

        {/* Ações */}
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}

        {canConfirm && (
          <Button
            size="sm"
            onClick={() => handleAction('confirm')}
            disabled={loading !== null}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-8 px-3 gap-1.5"
          >
            {loading === 'confirm' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Confirmar
          </Button>
        )}

        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('cancel')}
            disabled={loading !== null}
            className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs h-8 px-3 gap-1.5"
          >
            {loading === 'cancel' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            Cancelar
          </Button>
        )}

        {currentStatus === 'CONFIRMED' && status === 'PAID' && (
          <span className="text-xs text-teal-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
          </span>
        )}

        {currentStatus === 'CANCELLED' && status !== 'CANCELLED' && (
          <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Cancelado
          </span>
        )}
      </div>

      {/* Detalhes expandidos */}
      {expanded && hasDetails && (
        <div className="px-5 pb-4 space-y-3">

          {addOns.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Add-ons contratados
              </p>
              <div className="flex flex-wrap gap-2">
                {addOns.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg"
                  >
                    {a.name}
                    <span className="text-teal-600 font-bold ml-1">{fmt(a.price)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Observações
              </p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 leading-relaxed">
                {notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
