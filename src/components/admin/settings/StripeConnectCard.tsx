'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, ExternalLink, Unlink, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ConnectStatus {
  connected:          boolean
  accountId?:         string
  status?:            string
  chargesEnabled?:    boolean
  detailsSubmitted?:  boolean
  platformFeePercent?: number
}

export function StripeConnectCard() {
  const [status, setStatus]   = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/connect/status')
      const data = await res.json() as ConnectStatus
      setStatus(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStatus()

    // Lê parâmetros da URL (retorno do OAuth)
    const params = new URLSearchParams(window.location.search)
    if (params.get('stripe_connected')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function handleDisconnect() {
    if (!confirm('Tem certeza que deseja desconectar sua conta Stripe? Os pagamentos futuros não serão repassados.')) return
    setDisconnecting(true)
    try {
      await fetch('/api/stripe/connect/disconnect', { method: 'DELETE' })
      await fetchStatus()
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status atual */}
      {status?.connected ? (
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Conta Stripe conectada</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">ID da conta</p>
              <p className="font-mono text-xs text-gray-700">{status.accountId}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <StatusBadge status={status.status ?? ''} />
            </div>
            <div>
              <p className="text-gray-500">Recebe pagamentos</p>
              <p className="font-medium">{status.chargesEnabled ? '✅ Sim' : '⏳ Pendente'}</p>
            </div>
            <div>
              <p className="text-gray-500">Taxa da plataforma</p>
              <p className="font-medium">{status.platformFeePercent}%</p>
            </div>
          </div>

          {!status.chargesEnabled && (
            <div className="flex items-start gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Sua conta ainda não está habilitada para receber pagamentos. Complete o cadastro no Stripe Dashboard.</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={`https://dashboard.stripe.com/${status.accountId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir Stripe Dashboard
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {disconnecting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Unlink className="w-3 h-3" />
              }
              Desconectar
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <svg viewBox="0 0 60 25" className="w-8 fill-gray-400">
              <path d="M0 0h60v25H0z" fill="none"/>
              <text x="0" y="20" fontSize="20" fontWeight="bold">stripe</text>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-800">Conecte sua conta Stripe</p>
            <p className="text-sm text-gray-500 mt-1">
              Receba os pagamentos dos seus clientes diretamente na sua conta Stripe.
              Uma taxa de plataforma é descontada automaticamente.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = '/api/stripe/connect/authorize' }}
            className="bg-[#635bff] hover:bg-[#5851e5] text-white"
          >
            Conectar com Stripe
          </Button>
        </div>
      )}

      {/* Hold / Capture toggle */}
      <HoldCaptureToggle />

      {/* Explicação do fluxo */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Como funciona</p>
        <ul className="space-y-1 text-blue-700 list-disc list-inside">
          <li>Seus clientes pagam no checkout normalmente</li>
          <li>O valor é repassado para sua conta Stripe automaticamente</li>
          <li>A plataforma retém uma pequena taxa de serviço</li>
          <li>Você vê todos os pagamentos no seu Stripe Dashboard</li>
        </ul>
      </div>
    </div>
  )
}

// ── Hold/Capture toggle ───────────────────────────────────────────────────────

function HoldCaptureToggle() {
  const params = useParams()
  const tenantSlug = params?.tenantSlug as string | undefined
  const [enabled, setEnabled] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [loaded,  setLoaded]  = useState(false)

  useEffect(() => {
    if (!tenantSlug) return
    fetch(`/api/t/${tenantSlug}/public/config`)
      .then(r => r.json())
      .catch(() => null)
      .then(() => setLoaded(true))
  }, [tenantSlug])

  async function toggle() {
    if (!tenantSlug) return
    setSaving(true)
    const next = !enabled
    try {
      const res = await fetch(`/api/t/${tenantSlug}/settings/hold-capture`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useHoldCapture: next }),
      })
      if (!res.ok) throw new Error()
      setEnabled(next)
      toast.success(next ? 'Hold/Capture ativado.' : 'Cobrança imediata ativada.')
    } catch {
      toast.error('Erro ao salvar configuração.')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-slate-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-800 text-sm">Hold/Capture (pré-autorização)</p>
            <button
              onClick={toggle}
              disabled={saving}
              className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-teal-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Reserva o valor no cartão do cliente <strong>48h antes</strong> da limpeza e cobra somente após a conclusão.
            Prática padrão no mercado americano — elimina estornos por "no-show".
          </p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active:     { label: 'Ativo',      className: 'bg-green-100 text-green-700' },
    pending:    { label: 'Pendente',   className: 'bg-yellow-100 text-yellow-700' },
    restricted: { label: 'Restrito',  className: 'bg-red-100 text-red-700' },
    unknown:    { label: 'Desconhecido', className: 'bg-gray-100 text-gray-600' },
  }
  const cfg = map[status] ?? map['unknown']!
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
