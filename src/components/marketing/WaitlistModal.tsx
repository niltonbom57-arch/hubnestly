'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  X, Loader2, CheckCircle2, ArrowRight, Sparkles,
  Building2, User, Mail, Phone, MapPin, Users,
} from 'lucide-react'

interface WaitlistModalProps {
  onClose: () => void
}

const TEAM_OPTIONS = [
  { value: '1',   label: 'Só eu (autônomo)' },
  { value: '2-3', label: '2 a 3 pessoas' },
  { value: '4-8', label: '4 a 8 pessoas' },
  { value: '9+',  label: '9 ou mais' },
]

export function WaitlistModal({ onClose }: WaitlistModalProps) {
  const [form, setForm] = useState({
    companyName: '',
    ownerName:   '',
    email:       '',
    phone:       '',
    city:        '',
    teamCount:   '',
    message:     '',
  })
  const [errors, setErrors]   = useState<Partial<typeof form>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [alreadyIn, setAlreadyIn] = useState(false)

  function set(key: keyof typeof form, val: string) {
    setForm((p) => ({ ...p, [key]: val }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  function validate() {
    const e: Partial<typeof form> = {}
    if (!form.companyName.trim()) e.companyName = 'Obrigatório'
    if (!form.ownerName.trim())   e.ownerName   = 'Obrigatório'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'para-empresas' }),
      })
      const json = await res.json()
      if (json.success) {
        setDone(true)
        if (json.alreadyRegistered) setAlreadyIn(true)
      } else {
        setErrors({ email: json.error ?? 'Erro ao enviar' })
      }
    } catch {
      setErrors({ email: 'Erro de conexão. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-t-3xl p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-teal-100 text-xs font-semibold uppercase tracking-wide">Lista de espera</p>
              <h2 className="text-white font-extrabold text-xl">Garanta seu lugar</h2>
            </div>
          </div>
          <p className="text-teal-100 text-sm leading-relaxed">
            Deixe seus dados e entraremos em contato assim que sua empresa estiver pronta para começar a usar a plataforma.
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {done ? (
            /* Tela de sucesso */
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-teal-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3">
                {alreadyIn ? 'Você já está na lista! 🎉' : 'Recebemos seus dados! 🎉'}
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                {alreadyIn
                  ? 'Seu email já estava cadastrado. Entraremos em contato em breve com as próximas novidades.'
                  : `Ótimo, ${form.ownerName.split(' ')[0]}! Sua empresa "${form.companyName}" entrou na lista. Entraremos em contato no email ${form.email} assim que tiver novidades.`
                }
              </p>
              <div className="bg-teal-50 rounded-2xl px-6 py-4 mb-6 text-sm text-teal-700 font-medium">
                Enquanto isso, você já pode criar sua conta e explorar a plataforma grátis por 14 dias.
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => { window.location.href = '/onboarding' }}
                  className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Criar conta e começar agora <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full rounded-xl">
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            /* Formulário */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Empresa */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Nome da empresa *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    autoFocus
                    placeholder="Ex: Clean & Shine Services"
                    value={form.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                    className={`pl-9 h-11 rounded-xl ${errors.companyName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  />
                </div>
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
              </div>

              {/* Nome do dono */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Seu nome *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Ana Costa"
                    value={form.ownerName}
                    onChange={(e) => set('ownerName', e.target.value)}
                    className={`pl-9 h-11 rounded-xl ${errors.ownerName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  />
                </div>
                {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
              </div>

              {/* Email + Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      placeholder="ana@empresa.com"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      className={`pl-9 h-11 rounded-xl text-sm ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="tel"
                      placeholder="(239) 000-0000"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      className="pl-9 h-11 rounded-xl text-sm border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Cidade + Tamanho */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Cidade principal
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Fort Myers, FL"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      className="pl-9 h-11 rounded-xl text-sm border-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Tamanho da equipe
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                    <select
                      value={form.teamCount}
                      onChange={(e) => set('teamCount', e.target.value)}
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    >
                      <option value="">Selecionar</option>
                      {TEAM_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mensagem opcional */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Alguma dúvida ou comentário? <span className="text-slate-400 normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  placeholder="Ex: Quero entender melhor como funciona o pagamento..."
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 resize-none outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 placeholder:text-slate-400"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base shadow-md shadow-teal-200/60"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                  : <><Sparkles className="w-4 h-4 mr-2" />Quero participar da lista de espera</>
                }
              </Button>

              <p className="text-center text-xs text-slate-400">
                Seus dados são privados e não serão compartilhados. Prometemos não mandar spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
