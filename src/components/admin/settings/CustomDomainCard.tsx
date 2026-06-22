'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Globe, Copy, Check, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  tenantSlug: string
  currentDomain: string | null
}  

export function CustomDomainCard({ tenantSlug, currentDomain }: Props) {
  const [domain,    setDomain]    = useState(currentDomain    ?? '')
  const [saving,    setSaving]    = useState(false)
  const [copied,    setCopied]    = useState(false)

  const platformHost = typeof window !== 'undefined'
    ? window.location.host
    : 'hubnestly.com'

  const cnameTarget = `${tenantSlug}.${platformHost}`
  const defaultUrl  = `https://${platformHost}/t/${tenantSlug}`

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/t/${tenantSlug}/settings/domain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain: domain.trim() || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('Domínio salvo com sucesso!')
    } catch {
      toast.error('Erro ao salvar domínio.')
    } finally {
      setSaving(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Current URL */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">URL padrão da sua página</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-teal-700 font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 truncate">
            {defaultUrl}
          </code>
          <Button
            variant="outline" size="sm"
            onClick={() => copyToClipboard(defaultUrl)}
            className="shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <a href={defaultUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Custom domain */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">
            Domínio personalizado (opcional)
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="booking.suaempresa.com"
              className="pl-9 h-11 rounded-xl border-slate-200 font-mono text-sm"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Use um subdomínio como <code className="font-mono">booking.suaempresa.com</code> ou <code className="font-mono">agendar.suaempresa.com</code>
          </p>
        </div>

        {/* CNAME instructions */}
        {domain && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">Configure o CNAME no seu provedor de DNS</p>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              No painel do seu domínio (GoDaddy, Namecheap, Cloudflare, etc.), adicione o seguinte registro:
            </p>
            <div className="bg-white rounded-lg border border-amber-200 overflow-hidden text-xs font-mono">
              <div className="grid grid-cols-3 bg-amber-100 px-3 py-1.5 text-amber-700 font-semibold">
                <span>Tipo</span>
                <span>Nome / Host</span>
                <span>Valor / Target</span>
              </div>
              <div className="grid grid-cols-3 px-3 py-2.5 text-slate-700 gap-2">
                <span className="font-bold">CNAME</span>
                <span className="text-teal-700 truncate">{domain.split('.').slice(0, -2).join('.') || '@'}</span>
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="text-slate-600 truncate">{cnameTarget}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cnameTarget)}
                    className="shrink-0 text-slate-400 hover:text-slate-700"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-amber-600">
              ⏱ A propagação do DNS pode levar até 48 horas. Após configurar, avise nossa equipe para ativar o SSL.
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="bg-teal-600 hover:bg-teal-700 text-white h-10 px-6 rounded-xl font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Salvar domínio
        </Button>
      </form>

      {/* Stripe Connect note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Stripe Connect</p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Com o <strong>Stripe Connect</strong> ativo (aba Pagamentos), cada cobrança vai diretamente para a sua conta Stripe.
          Nossa plataforma deduz automaticamente a taxa de {tenantSlug ? '' : '10%'} antes do repasse — sem esforço manual da sua parte.
        </p>
      </div>
    </div>
  )
}
