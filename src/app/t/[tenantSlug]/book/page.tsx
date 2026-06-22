'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useI18n } from '@/lib/i18n/context'
import {
  ArrowLeft, ArrowRight, Check, Home, Bath, BedDouble,
  Zap, RefreshCw, CalendarDays, Sparkles, ChevronDown, ChevronUp,
  Shield, Clock, Phone, Mail, User, Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantConfig {
  name: string
  slug: string
  branding: {
    primaryColor: string
    logoUrl: string | null
    slogan: string | null
    supportPhone: string | null
    whatsapp: string | null
  }
  pricing: {
    basePrice: number
    pricePerBedroom: number
    pricePerBathroom: number
    pricePerLivingRoom: number
    pricePerKitchen: number
    pricePerOffice: number
    pricePerGarage: number
    priceLaundry: number
    pricePool: number
    pricePatio: number
    priceBalcony: number
    priceBasement: number
    priceGym: number
  }
  recurringDiscounts: { weekly: number; biweekly: number; monthly: number }
}

type Frequency = 'once' | 'weekly' | 'biweekly' | 'monthly'
type CleaningType = 'standard' | 'deep'

interface RoomsState {
  bedrooms: number
  bathrooms: number
  livingRooms: number
  kitchens: number
  offices: number
  garages: number
  hasLaundry: boolean
  hasPool: boolean
  hasPatio: boolean
  hasBalcony: boolean
  hasBasement: boolean
  hasGym: boolean
}

const INITIAL_ROOMS: RoomsState = {
  bedrooms: 3,
  bathrooms: 2,
  livingRooms: 1,
  kitchens: 1,
  offices: 0,
  garages: 0,
  hasLaundry: false,
  hasPool: false,
  hasPatio: false,
  hasBalcony: false,
  hasBasement: false,
  hasGym: false,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPrice(rooms: RoomsState, cfg: TenantConfig['pricing']): number {
  let total = cfg.basePrice
  total += rooms.bedrooms    * cfg.pricePerBedroom
  total += rooms.bathrooms   * cfg.pricePerBathroom
  total += rooms.livingRooms * cfg.pricePerLivingRoom
  total += rooms.kitchens    * cfg.pricePerKitchen
  total += rooms.offices     * cfg.pricePerOffice
  total += rooms.garages     * cfg.pricePerGarage
  if (rooms.hasLaundry)  total += cfg.priceLaundry
  if (rooms.hasPool)     total += cfg.pricePool
  if (rooms.hasPatio)    total += cfg.pricePatio
  if (rooms.hasBalcony)  total += cfg.priceBalcony
  if (rooms.hasBasement) total += cfg.priceBasement
  if (rooms.hasGym)      total += cfg.priceGym
  return total
}

function applyDiscount(price: number, pct: number) {
  return price * (1 - pct / 100)
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// ─── Counter component ────────────────────────────────────────────────────────

function Counter({ value, min = 0, max = 10, onChange, label, icon }: {
  value: number; min?: number; max?: number
  onChange: (v: number) => void; label: string; icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2.5">
        <span className="text-slate-400">{icon}</span>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-slate-400 disabled:opacity-30 transition-colors text-lg font-bold"
        >−</button>
        <span className="w-6 text-center font-extrabold text-slate-900 text-lg">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-slate-400 disabled:opacity-30 transition-colors text-lg font-bold"
        >+</button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicBookPage() {
  const params  = useParams()
  const router  = useRouter()
  const { locale } = useI18n()
  const tenantSlug = params.tenantSlug as string

  const [config, setConfig] = useState<TenantConfig | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [rooms, setRooms] = useState<RoomsState>(INITIAL_ROOMS)
  const [cleaningType, setCleaningType] = useState<CleaningType>('standard')
  const [frequency, setFrequency] = useState<Frequency>('once')
  const [showExtras, setShowExtras] = useState(false)
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Load tenant config ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/t/${tenantSlug}/public/config`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setConfig)
      .catch(() => setLoadError(true))
  }, [tenantSlug])

  // ── Price calculation ───────────────────────────────────────────────────
  const basePrice = config ? calcPrice(rooms, config.pricing) : 0
  const deepMultiplier = cleaningType === 'deep' ? 1.35 : 1
  const priceAfterType = basePrice * deepMultiplier
  const discountPct = frequency === 'weekly'   ? (config?.recurringDiscounts.weekly   ?? 10)
                    : frequency === 'biweekly'  ? (config?.recurringDiscounts.biweekly ?? 8)
                    : frequency === 'monthly'   ? (config?.recurringDiscounts.monthly  ?? 5)
                    : 0
  const finalPrice = discountPct > 0 ? applyDiscount(priceAfterType, discountPct) : priceAfterType
  const savings    = priceAfterType - finalPrice

  // ── Room updater ────────────────────────────────────────────────────────
  const setRoom = useCallback((key: keyof RoomsState) => (v: number | boolean) => {
    setRooms(prev => ({ ...prev, [key]: v }))
  }, [])

  // ── Submit: redirect to register with params ────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const query = new URLSearchParams({
      tenant: tenantSlug,
      name,
      email,
      phone,
      bedrooms:    String(rooms.bedrooms),
      bathrooms:   String(rooms.bathrooms),
      frequency,
      price:       String(Math.round(finalPrice)),
      cleanType:   cleaningType,
    })
    router.push(`/auth/register/cliente?${query}`)
  }

  const primaryColor = config?.branding.primaryColor ?? '#0d9488'
  const step1Done = rooms.bedrooms >= 1 && rooms.bathrooms >= 1
  const step3Valid = name.trim().length >= 2 && email.includes('@') && phone.length >= 10

  // ── Labels (bilingual) ──────────────────────────────────────────────────
  const L = locale === 'pt' ? {
    getQuote:    'Calcule seu preço',
    subtitle:    'Sem surpresas. Veja o preço exato agora.',
    step1:       'Detalhes da residência',
    step2:       'Frequência do serviço',
    step3:       'Seus dados',
    bedrooms:    'Quartos',
    bathrooms:   'Banheiros',
    livingRooms: 'Salas de estar',
    kitchens:    'Cozinhas',
    offices:     'Escritórios',
    garages:     'Vagas de garagem',
    extras:      'Áreas adicionais',
    laundry:     'Lavanderia',
    pool:        'Área da piscina',
    patio:       'Pátio / área externa',
    balcony:     'Varanda',
    basement:    'Porão',
    gym:         'Academia',
    standard:    'Limpeza padrão',
    deep:        'Limpeza profunda',
    deepDesc:    '+35% · Ideal para primeira vez ou muito sujo',
    once:        'Única vez',
    weekly:      'Semanal',
    biweekly:    'Quinzenal',
    monthly:     'Mensal',
    discount:    'de desconto',
    yourPrice:   'Seu preço estimado',
    perCleaning: 'por limpeza',
    youSave:     'Você economiza',
    namePH:      'Seu nome completo',
    emailPH:     'seu@email.com',
    phonePH:     '(239) 000-0000',
    next:        'Continuar',
    back:        'Voltar',
    cta:         'Criar conta e agendar',
    trust1:      'Pagamento seguro via Stripe',
    trust2:      'Sem contratos',
    trust3:      'Garantia de satisfação',
    showExtras:  'Mostrar áreas adicionais',
    hideExtras:  'Ocultar áreas adicionais',
  } : locale === 'es' ? {
    getQuote:    'Calcule su precio',
    subtitle:    'Sin sorpresas. Vea el precio exacto ahora.',
    step1:       'Detalles del hogar',
    step2:       'Frecuencia del servicio',
    step3:       'Sus datos',
    bedrooms:    'Habitaciones',
    bathrooms:   'Baños',
    livingRooms: 'Salas de estar',
    kitchens:    'Cocinas',
    offices:     'Oficinas',
    garages:     'Garajes',
    extras:      'Áreas adicionales',
    laundry:     'Lavandería',
    pool:        'Área de piscina',
    patio:       'Patio / área exterior',
    balcony:     'Balcón',
    basement:    'Sótano',
    gym:         'Gimnasio',
    standard:    'Limpieza estándar',
    deep:        'Limpieza profunda',
    deepDesc:    '+35% · Ideal para primera vez o muy sucio',
    once:        'Una sola vez',
    weekly:      'Semanal',
    biweekly:    'Quincenal',
    monthly:     'Mensual',
    discount:    'de descuento',
    yourPrice:   'Su precio estimado',
    perCleaning: 'por limpieza',
    youSave:     'Ahorra',
    namePH:      'Su nombre completo',
    emailPH:     'su@email.com',
    phonePH:     '(239) 000-0000',
    next:        'Continuar',
    back:        'Volver',
    cta:         'Crear cuenta y agendar',
    trust1:      'Pago seguro con Stripe',
    trust2:      'Sin contratos',
    trust3:      'Garantía de satisfacción',
    showExtras:  'Mostrar áreas adicionales',
    hideExtras:  'Ocultar áreas adicionales',
  } : {
    getQuote:    'Get your instant quote',
    subtitle:    'No surprises. See the exact price right now.',
    step1:       'Home details',
    step2:       'Service frequency',
    step3:       'Your information',
    bedrooms:    'Bedrooms',
    bathrooms:   'Bathrooms',
    livingRooms: 'Living rooms',
    kitchens:    'Kitchens',
    offices:     'Home offices',
    garages:     'Garage bays',
    extras:      'Additional areas',
    laundry:     'Laundry room',
    pool:        'Pool area',
    patio:       'Patio / outdoor area',
    balcony:     'Balcony',
    basement:    'Basement',
    gym:         'Home gym',
    standard:    'Standard cleaning',
    deep:        'Deep cleaning',
    deepDesc:    '+35% · Best for first-time or heavily soiled',
    once:        'One-time',
    weekly:      'Weekly',
    biweekly:    'Bi-weekly',
    monthly:     'Monthly',
    discount:    'off',
    yourPrice:   'Your estimated price',
    perCleaning: 'per cleaning',
    youSave:     'You save',
    namePH:      'Your full name',
    emailPH:     'you@email.com',
    phonePH:     '(239) 000-0000',
    next:        'Continue',
    back:        'Back',
    cta:         'Create account & book',
    trust1:      'Secure payment via Stripe',
    trust2:      'No contracts',
    trust3:      'Satisfaction guaranteed',
    showExtras:  'Show additional areas',
    hideExtras:  'Hide additional areas',
  }

  // ── Loading / error states ──────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Company not found.</p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/t/${tenantSlug}`}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {config.branding.logoUrl ? (
              <img src={config.branding.logoUrl} alt={config.name} className="h-6 w-auto" />
            ) : (
              <span className="font-extrabold text-slate-900">{config.name}</span>
            )}
          </Link>
          <LanguageSwitcher variant="light" compact />
        </div>
      </nav>

      {/* ── Price sticky bar ──────────────────────────────────── */}
      {config && (
        <div
          className="sticky top-14 z-30 border-b"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
            <span className="text-white/80 text-sm font-medium">{L.yourPrice}</span>
            <div className="flex items-center gap-3">
              {discountPct > 0 && (
                <span className="text-white/60 line-through text-sm">{fmtUSD(priceAfterType)}</span>
              )}
              <span className="text-white font-extrabold text-xl">{fmtUSD(finalPrice)}</span>
              {discountPct > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  -{discountPct}% {L.discount}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step indicators ────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-2">
          {([1, 2, 3] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={
                  step > s ? { backgroundColor: primaryColor, color: '#fff' }
                  : step === s ? { backgroundColor: primaryColor, color: '#fff' }
                  : { backgroundColor: '#e2e8f0', color: '#64748b' }
                }
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {i < 2 && (
                <div
                  className="flex-1 h-0.5 rounded"
                  style={{ backgroundColor: step > s ? primaryColor : '#e2e8f0' }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[11px] font-medium text-slate-400">
          <span>{L.step1}</span>
          <span>{L.step2}</span>
          <span>{L.step3}</span>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-4 pb-24 space-y-4 mt-4">

        {/* ── STEP 1: Rooms ────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{L.step1}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{L.subtitle}</p>
            </div>

            {/* Cleaning type */}
            <div className="grid grid-cols-2 gap-3">
              {(['standard', 'deep'] as CleaningType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setCleaningType(type)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    cleaningType === type
                      ? 'border-current shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  style={cleaningType === type ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {}}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {type === 'standard' ? <Home className="w-4 h-4" style={cleaningType === type ? { color: primaryColor } : { color: '#94a3b8' }} /> : <Sparkles className="w-4 h-4" style={cleaningType === type ? { color: primaryColor } : { color: '#94a3b8' }} />}
                    <span className="text-sm font-bold text-slate-800">{type === 'standard' ? L.standard : L.deep}</span>
                  </div>
                  {type === 'deep' && (
                    <p className="text-[11px] text-slate-500 leading-snug">{L.deepDesc}</p>
                  )}
                </button>
              ))}
            </div>

            {/* Key rooms */}
            <div className="space-y-2">
              <Counter value={rooms.bedrooms}    min={1} max={10} onChange={setRoom('bedrooms')}    label={L.bedrooms}    icon={<BedDouble className="w-4 h-4" />} />
              <Counter value={rooms.bathrooms}   min={1} max={10} onChange={setRoom('bathrooms')}   label={L.bathrooms}   icon={<Bath       className="w-4 h-4" />} />
              <Counter value={rooms.livingRooms} min={0} max={5}  onChange={setRoom('livingRooms')} label={L.livingRooms} icon={<Home       className="w-4 h-4" />} />
              <Counter value={rooms.kitchens}    min={1} max={4}  onChange={setRoom('kitchens')}    label={L.kitchens}    icon={<Zap        className="w-4 h-4" />} />
            </div>

            {/* Extras toggle */}
            <button
              onClick={() => setShowExtras(v => !v)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
            >
              {showExtras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showExtras ? L.hideExtras : L.showExtras}
            </button>

            {showExtras && (
              <div className="space-y-2">
                <Counter value={rooms.offices}  min={0} max={5}  onChange={setRoom('offices')}  label={L.offices}  icon={<Home className="w-4 h-4" />} />
                <Counter value={rooms.garages}  min={0} max={4}  onChange={setRoom('garages')}  label={L.garages}  icon={<Home className="w-4 h-4" />} />

                {/* Toggle extras */}
                {([
                  ['hasLaundry',  L.laundry],
                  ['hasPool',     L.pool],
                  ['hasPatio',    L.patio],
                  ['hasBalcony',  L.balcony],
                  ['hasBasement', L.basement],
                  ['hasGym',      L.gym],
                ] as [keyof RoomsState, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setRoom(key)(!rooms[key])}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border-2 transition-all text-sm font-semibold ${
                      rooms[key]
                        ? 'text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                    style={rooms[key] ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                  >
                    {label}
                    {rooms[key] && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}

            <Button
              className="w-full h-12 text-white font-bold rounded-xl text-base"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setStep(2)}
              disabled={!step1Done}
            >
              {L.next} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── STEP 2: Frequency ────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{L.step2}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {locale === 'pt' ? 'Clientes recorrentes recebem desconto especial.' :
                 locale === 'es' ? 'Los clientes recurrentes reciben descuento especial.' :
                 'Recurring customers save more every time.'}
              </p>
            </div>

            <div className="space-y-3">
              {([
                { key: 'once',     label: L.once,     desc: locale === 'pt' ? 'Sem compromisso' : locale === 'es' ? 'Sin compromiso' : 'No commitment', discount: 0,    icon: <CalendarDays className="w-5 h-5" /> },
                { key: 'weekly',   label: L.weekly,   desc: locale === 'pt' ? 'Toda semana'     : locale === 'es' ? 'Cada semana'    : 'Every week',      discount: config.recurringDiscounts.weekly,   icon: <RefreshCw className="w-5 h-5" /> },
                { key: 'biweekly', label: L.biweekly, desc: locale === 'pt' ? 'A cada 2 semanas': locale === 'es' ? 'Cada 2 semanas' : 'Every 2 weeks',   discount: config.recurringDiscounts.biweekly, icon: <RefreshCw className="w-5 h-5" /> },
                { key: 'monthly',  label: L.monthly,  desc: locale === 'pt' ? 'Uma vez por mês' : locale === 'es' ? 'Una vez al mes'  : 'Once a month',   discount: config.recurringDiscounts.monthly,  icon: <RefreshCw className="w-5 h-5" /> },
              ] as { key: Frequency; label: string; desc: string; discount: number; icon: React.ReactNode }[]).map(opt => {
                const discountedPrice = opt.discount > 0 ? applyDiscount(priceAfterType, opt.discount) : priceAfterType
                const isSelected = frequency === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setFrequency(opt.key)}
                    className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected ? 'shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {}}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isSelected ? primaryColor : '#f1f5f9', color: isSelected ? '#fff' : '#64748b' }}
                    >
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{opt.label}</span>
                        {opt.discount > 0 && (
                          <span className="text-[11px] font-bold rounded-full px-2 py-0.5 text-white"
                            style={{ backgroundColor: primaryColor }}>
                            -{opt.discount}% {L.discount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-slate-900 text-lg">{fmtUSD(discountedPrice)}</p>
                      <p className="text-xs text-slate-400">{L.perCleaning}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {discountPct > 0 && (
              <div
                className="rounded-xl p-4 text-white flex items-center gap-3"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles className="w-5 h-5 shrink-0" />
                <p className="text-sm font-semibold">
                  {L.youSave} <strong>{fmtUSD(savings)}</strong> {locale !== 'en' ? 'em comparação com a limpeza única' : 'compared to one-time cleaning'}.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-semibold" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {L.back}
              </Button>
              <Button
                className="flex-1 h-12 text-white font-bold rounded-xl"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setStep(3)}
              >
                {L.next} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Contact ──────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{L.step3}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {locale === 'pt' ? 'Crie sua conta para confirmar o agendamento.' :
                 locale === 'es' ? 'Cree su cuenta para confirmar la cita.' :
                 'Create your account to confirm the booking.'}
              </p>
            </div>

            {/* Price summary card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                {locale === 'pt' ? 'Resumo' : locale === 'es' ? 'Resumen' : 'Summary'}
              </p>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-700 font-medium">
                  {rooms.bedrooms} {L.bedrooms.toLowerCase()} · {rooms.bathrooms} {L.bathrooms.toLowerCase()}
                  {cleaningType === 'deep' ? ` · ${L.deep}` : ''}
                  {frequency !== 'once' ? ` · ${frequency === 'weekly' ? L.weekly : frequency === 'biweekly' ? L.biweekly : L.monthly}` : ''}
                </span>
                <span className="font-extrabold text-2xl text-slate-900">{fmtUSD(finalPrice)}</span>
              </div>
              {discountPct > 0 && (
                <p className="text-sm text-green-600 font-semibold">✓ {L.youSave} {fmtUSD(savings)} ({discountPct}% {L.discount})</p>
              )}
            </div>

            {/* Contact fields */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5" />
                  {locale === 'pt' ? 'Nome completo' : locale === 'es' ? 'Nombre completo' : 'Full name'}
                </Label>
                <Input
                  id="name" value={name} onChange={e => setName(e.target.value)}
                  placeholder={L.namePH} required
                  className="h-11 rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </Label>
                <Input
                  id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={L.emailPH} required
                  className="h-11 rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {locale === 'pt' ? 'Telefone' : locale === 'es' ? 'Teléfono' : 'Phone number'}
                </Label>
                <Input
                  id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder={L.phonePH} required
                  className="h-11 rounded-xl border-slate-200 focus:border-teal-400 focus:ring-teal-400"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-semibold" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {L.back}
              </Button>
              <Button
                type="submit"
                disabled={!step3Valid || submitting}
                className="flex-1 h-12 text-white font-bold rounded-xl text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>{L.cta} <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-green-500" /> {L.trust1}</span>
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-500" /> {L.trust2}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-green-500" /> {L.trust3}</span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
