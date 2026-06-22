'use client'

import { useEffect, useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Send, Eye, X, Search } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  bookingCount: number
  lastBookingAt: string | null
  totalSpent: number
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function MarketingPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetch('/api/admin/marketing/clients')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setClients(d.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    )
  }, [clients, search])

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id))

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((c) => next.delete(c.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((c) => next.add(c.id))
        return next
      })
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function insertVariable(variable: string) {
    setMessage((prev) => prev + variable)
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) return
    setSending(true)
    setResult(null)
    try {
      const sendToAll = selected.size === 0
      const recipientIds = sendToAll ? [] : Array.from(selected)
      const res = await fetch('/api/admin/marketing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body: message, recipientIds, sendToAll }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
      } else {
        setResult(null)
        alert(data.error ?? 'Erro ao enviar emails')
      }
    } finally {
      setSending(false)
    }
  }

  const previewHtml = message
    .replace(/\{\{nome_cliente\}\}/g, '<strong>João Silva</strong>')
    .replace(/\{\{empresa\}\}/g, '<strong>HubNestly</strong>')
    .replace(/\n/g, '<br/>')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Email Marketing</h1>
        <p className="text-slate-500 text-sm mt-1">Envie campanhas de email para seus clientes</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left panel — client list */}
        <div className="flex-[3] rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
                <label htmlFor="select-all" className="text-sm text-slate-600 cursor-pointer select-none">
                  Selecionar todos
                </label>
              </div>
              {selected.size > 0 && (
                <span className="text-sm text-teal-600 font-semibold">
                  {selected.size} cliente{selected.size > 1 ? 's' : ''} selecionado{selected.size > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-50 max-h-[560px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Carregando clientes...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Nenhum cliente encontrado</div>
            ) : (
              filtered.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => toggleOne(client.id)}
                >
                  <Checkbox
                    checked={selected.has(client.id)}
                    onCheckedChange={() => toggleOne(client.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {initials(client.name ?? 'C')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{client.name}</p>
                    <p className="text-xs text-slate-400 truncate">{client.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs shrink-0">
                    <Badge variant="secondary" className="tabular-nums">
                      {client.bookingCount} ag.
                    </Badge>
                    <span className="text-emerald-600 font-semibold w-20 text-right">
                      {formatCurrency(client.totalSpent)}
                    </span>
                    <span className="text-slate-400 w-28 text-right">{formatDate(client.lastBookingAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel — composer */}
        <div className="flex-[2] rounded-2xl bg-white shadow-sm border border-slate-100 p-5 space-y-4 sticky top-6">
          <h2 className="font-bold text-slate-800 text-lg">Nova Campanha</h2>

          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">Para: </span>
            {selected.size === 0
              ? `Todos os clientes (${clients.length})`
              : `${selected.size} cliente${selected.size > 1 ? 's' : ''} selecionado${selected.size > 1 ? 's' : ''}`}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Assunto:</label>
            <Input
              placeholder="Ex: Oferta especial para você!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Mensagem:</label>
            <Textarea
              placeholder="Escreva sua mensagem aqui..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">Variáveis disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '{{nome_cliente}}', value: '{{nome_cliente}}' },
                { label: '{{empresa}}', value: '{{empresa}}' },
              ].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => insertVariable(v.value)}
                  className="text-xs px-2 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors font-mono"
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowPreview(true)}
              disabled={!message.trim()}
            >
              <Eye className="w-4 h-4 mr-1.5" /> Preview
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={handleSend}
              disabled={sending || !subject.trim() || !message.trim()}
            >
              <Send className="w-4 h-4 mr-1.5" />
              {sending ? 'Enviando...' : 'Enviar campanha'}
            </Button>
          </div>

          {result && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm flex gap-4">
              <span className="text-emerald-600 font-semibold">✅ {result.sent} enviado{result.sent !== 1 ? 's' : ''}</span>
              {result.failed > 0 && (
                <span className="text-red-500 font-semibold">❌ {result.failed} falharam</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Preview do email</h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="bg-slate-100 rounded-xl p-4 mb-3 text-sm text-slate-600">
                <span className="font-medium">Assunto: </span>{subject || '(sem assunto)'}
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-teal-600 px-8 py-6">
                  <h2 className="text-white font-bold text-xl">HubNestly</h2>
                </div>
                <div
                  className="px-8 py-6 text-slate-700 text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
                <div className="bg-slate-50 px-8 py-4 text-center text-xs text-slate-400">
                  © {new Date().getFullYear()} HubNestly. Todos os direitos reservados.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
