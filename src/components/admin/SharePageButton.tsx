'use client'

import { useState } from 'react'
import {
  Share2, Copy, CheckCircle2, X, MessageCircle,
  Globe, QrCode, ExternalLink, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SharePageButtonProps {
  tenantSlug: string
  tenantName: string
  /** Variante visual — 'header' para o topo, 'card' para o dashboard */
  variant?: 'header' | 'card' | 'dashboard'
}

export function SharePageButton({
  tenantSlug,
  tenantName,
  variant = 'header',
}: SharePageButtonProps) {
  const [open, setOpen]       = useState(false)
  const [copied, setCopied]   = useState(false)

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${tenantSlug}`
    : `https://seudominio.com/t/${tenantSlug}`

  const whatsappMsg = encodeURIComponent(
    `Olá! Agende sua limpeza residencial diretamente pelo nosso sistema:\n\n🔗 ${pageUrl}\n\nÉ rápido, fácil e você consegue ver os horários disponíveis na hora!`
  )
  const emailSubject = encodeURIComponent(`Agende sua limpeza — ${tenantName}`)
  const emailBody    = encodeURIComponent(
    `Olá!\n\nAgenda sua limpeza residencial pelo nosso sistema de agendamento online:\n\n${pageUrl}\n\nAté breve!\n${tenantName}`
  )

  async function handleCopy() {
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      {/* ── Botão gatilho ─── */}
      {variant === 'dashboard' ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 bg-white text-teal-700 hover:bg-teal-50 text-xs font-bold rounded-xl px-3 py-2 transition-colors shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          Compartilhar
        </button>
      ) : variant === 'header' ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-full px-3 py-1 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Compartilhar página
        </button>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold gap-2"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar página com clientes
        </Button>
      )}

      {/* ── Modal ─────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Share2 className="w-4.5 h-4.5 text-teal-600" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">Compartilhar página</h2>
                  <p className="text-xs text-slate-400">Envie o link para seus clientes agendarem</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* URL */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Link da sua página</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700 font-mono truncate flex-1">{pageUrl}</span>
                  <button
                    onClick={handleCopy}
                    className={`shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                      copied
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {copied
                      ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copiado!</>
                      : <><Copy className="w-3.5 h-3.5" /> Copiar</>
                    }
                  </button>
                </div>
              </div>

              {/* Opções de compartilhamento */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Enviar por</p>
                <div className="grid grid-cols-2 gap-2">

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${whatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] rounded-xl px-3 py-3 font-semibold text-sm transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm leading-tight">WhatsApp</p>
                      <p className="text-[11px] opacity-70 leading-tight">Enviar mensagem</p>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                    className="flex items-center gap-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 rounded-xl px-3 py-3 font-semibold text-sm transition-colors"
                  >
                    <Mail className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm leading-tight">Email</p>
                      <p className="text-[11px] opacity-70 leading-tight">Abrir e-mail</p>
                    </div>
                  </a>

                  {/* Abrir página */}
                  <a
                    href={`/t/${tenantSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-3 py-3 font-semibold text-sm transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm leading-tight">Ver página</p>
                      <p className="text-[11px] opacity-70 leading-tight">Abrir em nova aba</p>
                    </div>
                  </a>

                  {/* QR Code */}
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pageUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 rounded-xl px-3 py-3 font-semibold text-sm transition-colors"
                  >
                    <QrCode className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm leading-tight">QR Code</p>
                      <p className="text-[11px] opacity-70 leading-tight">Baixar imagem</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Dica */}
              <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex gap-2.5">
                <Globe className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <p className="text-xs text-teal-700 leading-relaxed">
                  Seus clientes podem agendar, ver preços e pagar diretamente nessa página — sem precisar criar conta.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
