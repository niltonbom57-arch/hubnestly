'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { HubNestlyLogo as GleamLogo } from '@/components/ui/HubNestlyLogo'
import {
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, Eye, EyeOff,
  Building2, MapPin, Sparkles, Globe, Lock, Home,
} from 'lucide-react'

// ─── Config ───────────────────────────────────────────────────────────────────

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
]

const COMMON_CITIES = [
  'Fort Myers','Naples','Bonita Springs','Cape Coral','Lehigh Acres',
  'Marco Island','Estero','Sanibel','Fort Lauderdale','Miami',
  'Orlando','Tampa','Jacksonville','Sarasota','Gainesville',
]

const COMPANY_EMOJIS = ['🏠','✨','🧹','🌟','💎','🌊','🍃','🦋','🌺','⭐']

function getEmoji(name: string) {
  if (!name) return '✨'
  const index = name.charCodeAt(0) % COMPANY_EMOJIS.length
  return COMPANY_EMOJIS[index]
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormData {
  companyName: string
  slug: string
  state: string
  cities: string[]
  customCity: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i < current
              ? 'bg-teal-500 w-6'
              : i === current
              ? 'bg-teal-500 w-10'
              : 'bg-slate-200 w-6'
          }`}
        />
      ))}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-500 text-sm font-medium mb-2">{children}</p>
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">⚠ {msg}</p>
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [customCityInput, setCustomCityInput] = useState('')
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState<FormData>({
    companyName: '',
    slug: '',
    state: 'Florida',
    cities: [],
    customCity: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })

  // Filtered cities based on state
  const citiesForState = COMMON_CITIES

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // Auto-slug when company name changes
  function handleCompanyName(value: string) {
    set('companyName', value)
    const auto = slugify(value)
    set('slug', auto)
    setSlugStatus('idle')
    if (slugTimer.current) clearTimeout(slugTimer.current)
    if (auto.length >= 2) {
      slugTimer.current = setTimeout(() => checkSlug(auto), 700)
    }
  }

  function handleSlugChange(value: string) {
    const clean = slugify(value) || value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    set('slug', clean)
    setSlugStatus('idle')
    if (slugTimer.current) clearTimeout(slugTimer.current)
    if (clean.length >= 2) {
      slugTimer.current = setTimeout(() => checkSlug(clean), 700)
    }
  }

  async function checkSlug(s: string) {
    if (s.length < 2) return
    setSlugStatus('checking')
    try {
      const res = await fetch(`/api/onboarding?slug=${s}`)
      const json = await res.json()
      setSlugStatus(json.data?.available ? 'ok' : 'taken')
    } catch {
      setSlugStatus('idle')
    }
  }

  function toggleCity(city: string) {
    if (form.cities.includes(city)) {
      set('cities', form.cities.filter((c) => c !== city))
    } else {
      set('cities', [...form.cities, city])
    }
  }

  function addCustomCity() {
    const city = customCityInput.trim()
    if (!city || form.cities.includes(city)) return
    set('cities', [...form.cities, city])
    setCustomCityInput('')
  }

  // ── Validações por passo ────────────────────────────────────────────────────

  function validateStep0(): boolean {
    const e: typeof errors = {}
    if (!form.companyName.trim() || form.companyName.length < 2) e.companyName = 'Digite o nome da empresa (mínimo 2 caracteres)'
    if (!form.slug || form.slug.length < 2) e.slug = 'O endereço é obrigatório'
    if (slugStatus === 'taken') e.slug = 'Este endereço já está em uso. Tente outro.'
    if (slugStatus === 'checking') e.slug = 'Aguarde a verificação...'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep1(): boolean {
    const e: typeof errors = {}
    if (form.cities.length === 0) e.cities = 'Selecione ao menos uma cidade'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2(): boolean {
    const e: typeof errors = {}
    if (!form.adminName.trim() || form.adminName.length < 2) e.adminName = 'Seu nome é obrigatório'
    if (!form.adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) e.adminEmail = 'Email inválido'
    if (!form.adminPassword || form.adminPassword.length < 8) e.adminPassword = 'Senha deve ter ao menos 8 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function nextStep() {
    if (step === 0 && !validateStep0()) return
    if (step === 1 && !validateStep1()) return
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    if (!validateStep2()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          slug: form.slug,
          adminName: form.adminName,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
          cities: form.cities,
          timezone: 'America/New_York',
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error ?? 'Erro ao criar conta')
        setSubmitting(false)
        return
      }

      // Login automático após cadastro da empresa
      toast.success('Empresa criada! Entrando no painel...')
      const result = await signIn('credentials', {
        email:      form.adminEmail,
        password:   form.adminPassword,
        tenantSlug: form.slug,
        redirect:   false,
      })

      if (result?.ok) {
        // Redireciona direto para o painel admin da empresa
        router.push(`/t/${form.slug}/admin`)
        router.refresh()
        return
      }

      // Se o login automático falhar, mostra a tela de sucesso com link manual
      setStep(3)
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
      setSubmitting(false)
    }
  }

  const TOTAL_STEPS = 3

  // ── Passo 0: Empresa ────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <WizardShell step={0} totalSteps={TOTAL_STEPS}>
        <StepHeader
          emoji={form.companyName ? (getEmoji(form.companyName) ?? '✨') : '✨'}
          title={form.companyName ? `Olá, ${form.companyName.split(' ')[0] ?? form.companyName}!` : 'Olá! Vamos começar 👋'}
          subtitle="Como se chama sua empresa de limpeza?"
        />

        <div className="space-y-5">
          {/* Nome */}
          <div>
            <FieldLabel>Nome da empresa</FieldLabel>
            <Input
              autoFocus
              placeholder="Ex: Clean & Shine Services"
              value={form.companyName}
              onChange={(e) => handleCompanyName(e.target.value)}
              className="h-12 rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500 text-base"
            />
            <ErrorText msg={errors.companyName} />
          </div>

          {/* Slug — link único */}
          <div>
            <FieldLabel>Endereço do seu painel de agendamentos</FieldLabel>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500 transition-all">
              <div className="bg-slate-50 px-3 h-12 flex items-center border-r border-slate-200 shrink-0">
                <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
                <span className="text-xs text-slate-400 font-mono">hubnestly.com/t/</span>
              </div>
              <input
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="minha-empresa"
                className="flex-1 px-3 h-12 text-sm font-mono bg-transparent outline-none text-slate-800"
              />
              {slugStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-3" />}
              {slugStatus === 'ok'       && <CheckCircle2 className="w-4 h-4 text-teal-500 mr-3" />}
              {slugStatus === 'taken'    && <span className="text-red-500 text-xs mr-3">✗</span>}
            </div>
            {slugStatus === 'ok'    && <p className="text-teal-600 text-xs mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Disponível! Este será o link dos seus clientes.</p>}
            {slugStatus === 'taken' && <p className="text-red-500 text-xs mt-1.5">Este endereço já está em uso. Tente outro.</p>}
            <ErrorText msg={errors.slug} />

            {/* Preview */}
            {form.slug && slugStatus !== 'taken' && (
              <div className="mt-3 p-3 bg-teal-50 border border-teal-100 rounded-xl">
                <p className="text-xs text-teal-600 font-medium mb-1">Seus clientes vão agendar em:</p>
                <p className="text-sm font-mono text-teal-800 font-bold">hubnestly.com/t/{form.slug}</p>
              </div>
            )}
          </div>

          <NavButtons
            onNext={nextStep}
            nextLabel="Próximo: onde você atende"
            nextIcon={<ArrowRight className="w-4 h-4 ml-1.5" />}
          />
        </div>
      </WizardShell>
    )
  }

  // ── Passo 1: Cidades ────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <WizardShell step={1} totalSteps={TOTAL_STEPS}>
        <StepHeader
          emoji="📍"
          title="Onde você atende?"
          subtitle="Selecione as cidades onde sua empresa realiza limpezas."
        />

        <div className="space-y-5">
          {/* Estado */}
          <div>
            <FieldLabel>Estado (USA)</FieldLabel>
            <select
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
            >
              {US_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Cidades */}
          <div>
            <FieldLabel>Cidades ({form.cities.length} selecionada{form.cities.length !== 1 ? 's' : ''})</FieldLabel>
            <div className="flex flex-wrap gap-2 mb-3">
              {citiesForState.map((city) => {
                const active = form.cities.includes(city)
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      active
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                    }`}
                  >
                    {active && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {city}
                  </button>
                )
              })}
            </div>

            {/* Cidade customizada */}
            <div className="flex gap-2">
              <Input
                placeholder="Outra cidade..."
                value={customCityInput}
                onChange={(e) => setCustomCityInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCity() } }}
                className="h-10 rounded-xl border-slate-200 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomCity}
                className="rounded-xl shrink-0 h-10"
              >
                Adicionar
              </Button>
            </div>

            {/* Cidades customizadas adicionadas */}
            {form.cities.filter((c) => !citiesForState.includes(c)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.cities.filter((c) => !citiesForState.includes(c)).map((city) => (
                  <span key={city} className="flex items-center gap-1 bg-teal-600 text-white text-xs px-3 py-1.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {city}
                    <button onClick={() => toggleCity(city)} className="ml-1 opacity-70 hover:opacity-100">✕</button>
                  </span>
                ))}
              </div>
            )}

            <ErrorText msg={errors.cities} />
          </div>

          <NavButtons
            onBack={() => setStep(0)}
            onNext={nextStep}
            nextLabel="Próximo: criar minha conta"
            nextIcon={<ArrowRight className="w-4 h-4 ml-1.5" />}
          />
        </div>
      </WizardShell>
    )
  }

  // ── Passo 2: Admin ──────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <WizardShell step={2} totalSteps={TOTAL_STEPS}>
        <StepHeader
          emoji="👤"
          title="Quase lá! Crie seu acesso"
          subtitle="Esses dados são para você entrar no painel admin da sua empresa."
        />

        <div className="space-y-4">
          <div>
            <FieldLabel>Seu nome completo</FieldLabel>
            <Input
              autoFocus
              placeholder="Ana Costa"
              value={form.adminName}
              onChange={(e) => set('adminName', e.target.value)}
              className="h-12 rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
            />
            <ErrorText msg={errors.adminName} />
          </div>

          <div>
            <FieldLabel>Email (será seu login)</FieldLabel>
            <Input
              type="email"
              placeholder="ana@minhaempresa.com"
              value={form.adminEmail}
              onChange={(e) => set('adminEmail', e.target.value)}
              className="h-12 rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
            />
            <ErrorText msg={errors.adminEmail} />
          </div>

          <div>
            <FieldLabel>Senha</FieldLabel>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={form.adminPassword}
                onChange={(e) => set('adminPassword', e.target.value)}
                className="h-12 rounded-xl border-slate-200 pr-11 focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Indicador de força */}
            {form.adminPassword && (
              <div className="flex gap-1 mt-2">
                {[4,6,8,10].map((min, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      form.adminPassword.length >= min ? 'bg-teal-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            )}
            <ErrorText msg={errors.adminPassword} />
          </div>

          {/* Resumo antes de criar */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-sm">
            <p className="font-semibold text-slate-700 text-xs uppercase tracking-wide">Resumo da sua conta</p>
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="font-medium">{form.companyName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Globe className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="font-mono text-xs">hubnestly.com/t/{form.slug}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>{form.cities.slice(0, 3).join(', ')}{form.cities.length > 3 ? ` +${form.cities.length - 3}` : ''}</span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-md shadow-teal-200/60"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando sua conta...</>
                : <><Sparkles className="w-4 h-4 mr-2" />Criar minha conta grátis</>
              }
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              disabled={submitting}
              className="w-full text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
            </Button>
            <p className="text-center text-xs text-slate-400">
              <Lock className="w-3 h-3 inline mr-1" />
              Seus dados são protegidos · 14 dias grátis · Sem cartão de crédito
            </p>
          </div>
        </div>
      </WizardShell>
    )
  }

  // ── Passo 3: Sucesso 🎉 ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Confetti animation via CSS */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-teal-300/50 animate-bounce">
            <span className="text-4xl">🎉</span>
          </div>
          <div className="absolute -top-2 -right-2 text-2xl animate-spin" style={{ animationDuration: '3s' }}>⭐</div>
          <div className="absolute -bottom-2 -left-2 text-xl" style={{ animation: 'bounce 2s infinite 0.5s' }}>✨</div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
          Conta criada! 🚀
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          <span className="font-bold text-teal-600">{form.companyName}</span> agora está no HubNestly.
          Faça login para começar a configurar seu painel.
        </p>

        {/* Próximos passos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 text-left">
          <p className="font-bold text-slate-800 mb-4 text-sm">O que fazer agora:</p>
          <ol className="space-y-3">
            {[
              'Faça login com seu email e senha',
              'Configure seus preços em Configurações',
              'Adicione suas equipes em Times',
              'Compartilhe seu link com os clientes',
            ].map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        {/* Seu link */}
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6">
          <p className="text-xs text-teal-600 font-medium mb-1">Seu link de agendamentos:</p>
          <p className="font-mono text-sm font-bold text-teal-800">hubnestly.com/t/{form.slug}</p>
          <p className="text-xs text-teal-500 mt-1">Compartilhe este link com seus clientes!</p>
        </div>

        <Link href={`/auth/login?tenant=${form.slug}`}>
          <Button className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base">
            Entrar no meu painel <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function WizardShell({
  step, totalSteps, children,
}: {
  step: number
  totalSteps: number
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col">
      {/* Top nav */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors border border-slate-200 rounded-full px-3 py-1.5 bg-slate-50 hover:bg-teal-50">
            <Home className="w-3.5 h-3.5" /> Início
          </Link>
          <Link href="/para-empresas">
            <GleamLogo size="sm" variant="dark" />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher variant="light" />
          <StepIndicator current={step} total={totalSteps} />
          <span className="text-xs text-slate-400 font-medium">{step + 1} de {totalSteps}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-md">
          {/* Trial badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              14 dias grátis · Sem cartão de crédito
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
            {children}
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-teal-600 hover:underline font-semibold">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function StepHeader({
  emoji, title, subtitle,
}: {
  emoji: string
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-6">
      <div className="text-3xl mb-3">{emoji}</div>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{title}</h1>
      <p className="text-slate-500 text-sm">{subtitle}</p>
    </div>
  )
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Próximo',
  nextIcon,
  disabled = false,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextIcon?: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className="flex gap-2 pt-2">
      {onBack && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="flex-1 h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
      >
        {nextLabel}{nextIcon}
      </Button>
    </div>
  )
}
