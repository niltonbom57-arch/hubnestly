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
  Shield, Clock, Phone, Mail, User, Loader2, CheckCircle2,
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

interface TimeSlot {
  time: string
  startUtc: string
  endUtc: string
  teamId: string
}

type Frequency   = 'once' | 'weekly' | 'biweekly' | 'monthly'
type CleaningType = 'standard' | 'deep'
type Step        = 1 | 2 | 3 | 4

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
  bedrooms: 3, bathrooms: 2, livingRooms: 1, kitchens: 1,
  offices: 0, garages: 0,
  hasLaundry: false, hasPool: false, hasPatio: false,
  hasBalcony: false, hasBasement: false, hasGym: false,
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

function estimateDuration(rooms: RoomsState, type: CleaningType): number {
  return 90 + rooms.bedrooms * 30 + rooms.bathrooms * 20 + (type === 'deep' ? 30 : 0)
}

// Generate next 30 days (Mon–Sat only, skip today)
function getSelectableDays(): string[] {
  const days: string[] = []
  const d = new Date()
  d.setDate(d.getDate() + 1) // start tomorrow
  while (days.length < 30) {
    const dow = d.getDay()
    if (dow !== 0) { // skip Sunday
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      days.push(`${y}-${m}-${day}`)
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}

function fmtDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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

  const [config, setConfig]         = useState<TenantConfig | null>(null)
  const [loadError, setLoadError]   = useState(false)
  const [step, setStep]             = useState<Step>(1)
  const [rooms, setRooms]           = useState<RoomsState>(INITIAL_ROOMS)
  const [cleaningType, setCleaningType] = useState<CleaningType>('standard')
  const [frequency, setFrequency]   = useState<Frequency>('once')
  const [showExtras, setShowExtras] = useState(false)
  const [name,  setName]            = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)

  // Step 3 — date/time picker
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [slots, setSlots]               = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const selectableDays = getSelectableDays()

  // ── Load tenant config ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/t/${tenantSlug}/public/config`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setConfig)
      .catch(() => setLoadError(true))
  }, [tenantSlug])

  // ── Load slots when date changes ────────────────────────────────────────
  useEffect(() => {
    if (!selectedDate) { setSlots([]); return }
    setLoadingSlots(true)
    setSelectedSlot(null)
    const duration = estimateDuration(rooms, cleaningType)
    fetch(`/api/t/${tenantSlug}/public/availability?date=${selectedDate}&duration=${duration}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, tenantSlug, rooms, cleaningType])

  // ── Price calculation ───────────────────────────────────────────────────
  const basePrice      = config ? calcPrice(rooms, config.pricing) : 0
  const deepMultiplier = cleaningType === 'deep' ? 1.35 : 1
  const priceAfterType = basePrice * deepMultiplier
  const discountPct    = frequency === 'weekly'   ? (config?.recurringDiscounts.weekly   ?? 10)
                       : frequency === 'biweekly'  ? (config?.recurringDiscounts.biweekly ?? 8)
                       : frequency === 'monthly'   ? (config?.recurringDiscounts.monthly  ?? 5)
                       : 0
  const finalPrice  = discountPct > 0 ? applyDiscount(priceAfterType, discountPct) : priceAfterType
  const savings     = priceAfterType - finalPrice

  // ── Room updater ────────────────────────────────────────────────────────
  const setRoom = useCallback((key: keyof RoomsState) => (v: number | boolean) => {
    setRooms(prev => ({ ...prev, [key]: v }))
  }, [])

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/t/${tenantSlug}/public/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone,
          bedrooms:    rooms.bedrooms,
          bathrooms:   rooms.bathrooms,
          livingRooms: rooms.livingRooms,
          kitchens:    rooms.kitchens,
          offices:     rooms.offices,
          garages:     rooms.garages,
          hasLaundry:  rooms.hasLaundry,
          hasPool:     rooms.hasPool,
          hasPatio:    rooms.hasPatio,
          hasBalcony:  rooms.hasBalcony,
          hasBasement: rooms.hasBasement,
          hasGym:      rooms.hasGym,
          cleaningType,
          frequency,
          price:       Math.round(finalPrice),
          scheduledAt: selectedSlot.startUtc,
          teamId:      selectedSlot.teamId,
        }),
      })
      if (!res.ok) throw new Error('Erro ao agendar')
      setDone(true)
    } catch {
      alert('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const primaryColor = config?.branding.primaryColor ?? '#0d9488'
  const step1Done    = rooms.bedrooms >= 1 && rooms.bathrooms >= 1
  const step3Done    = !!selectedSlot
  const step4Valid   = name.trim().length >= 2 && email.includes('@') && phone.length >= 10

  // ── Labels ──────────────────────────────────────────────────────────────
  const L = locale === 'pt' ? {
    getQuote: 'Calcule seu preço',
    subtitle: 'Sem surpresas. Veja o preço exato agora.',
    step1: 'Detalhes da residência',
    step2: 'Frequência do serviço',
    step3: 'Data e horário',
    step4: 'Seus dados',
    bedrooms: 'Quartos',
    bathrooms: 'Banheiros',
    livingRooms: 'Salas de estar',
    kitchens: 'Cozinhas',
    offices: 'Escritórios',
    garages: 'Vagas de garagem',
    extras: 'Áreas adicionais',
    laundry: 'Lavanderia',
    pool: 'Área da piscina',
    patio: 'Pátio / área externa',
    balcony: 'Varanda',
    basement: 'Porão',
    gym: 'Academia',
    standard: 'Limpeza padrão',
    deep: 'Limpeza profunda',
    deepDesc: '+35% · Ideal para primeira vez ou muito sujo',
    once: 'Única vez',
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    discount: 'de desconto',
    yourPrice: 'Seu preço estimado',
    perCleaning: 'por limpeza',
    youSave: 'Você economiza',
    namePH: 'Seu nome completo',
    emailPH: 'seu@email.com',
    phonePH: '(239) 000-0000',
    back: 'Voltar',
    next: 'Continuar',
    cta: 'Confirmar agendamento',
    trust1: 'Sem cartão agora',
    trust2: 'Cancelamento grátis',
    trust3: 'Profissionais verificados',
    selectDate: 'Selecione uma data',
    selectTime: 'Selecione um horário',
    noSlots: 'Sem horários disponíveis neste dia. Tente outra data.',
    loadingSlots: 'Buscando horários...',
    confirmTitle: 'Agendamento confirmado! 🎉',
    confirmMsg: 'Entraremos em contato em breve para confirmar os detalhes.',
  } : locale === 'es' ? {
    getQuote: 'Calcule su precio',
    subtitle: 'Sin sorpresas. Vea el precio exacto ahora.',
    step1: 'Detalles del hogar',
    step2: 'Frecuencia del servicio',
    step3: 'Fecha y horario',
    step4: 'Sus datos',
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    livingRooms: 'Salas',
    kitchens: 'Cocinas',
    offices: 'Oficinas',
    garages: 'Garajes',
    extras: 'Áreas adicionales',
    laundry: 'Lavandería',
    pool: 'Área de piscina',
    patio: 'Patio / área exterior',
    balcony: 'Balcón',
    basement: 'Sótano',
    gym: 'Gimnasio',
    standard: 'Limpieza estándar',
    deep: 'Limpieza profunda',
    deepDesc: '+35% · Ideal para primera vez o muy sucio',
    once: 'Una vez',
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    discount: 'de descuento',
    yourPrice: 'Su precio estimado',
    perCleaning: 'por limpieza',
    youSave: 'Ahorra',
    namePH: 'Su nombre completo',
    emailPH: 'su@email.com',
    phonePH: '(239) 000-0000',
    back: 'Volver',
    next: 'Continuar',
    cta: 'Confirmar cita',
    trust1: 'Sin tarjeta ahora',
    trust2: 'Cancelación gratis',
    trust3: 'Profesionales verificados',
    selectDate: 'Seleccione una fecha',
    selectTime: 'Seleccione un horario',
    noSlots: 'Sin horarios disponibles este día. Pruebe otra fecha.',
    loadingSlots: 'Buscando horarios...',
    confirmTitle: '¡Cita confirmada! 🎉',
    confirmMsg: 'Nos pondremos en contacto pronto para confirmar los detalles.',
  } : {
    getQuote: 'Get your price',
    subtitle: 'No surprises. See the exact price now.',
    step1: 'Home details',
    step2: 'Service frequency',
    step3: 'Date & time',
    step4: 'Your info',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    livingRooms: 'Living rooms',
    kitchens: 'Kitchens',
    offices: 'Offices',
    garages: 'Garages',
    extras: 'Extra areas',
    laundry: 'Laundry room',
    pool: 'Pool area',
    patio: 'Patio / outdoor',
    balcony: 'Balcony',
    basement: 'Basement',
    gym: 'Gym',
    standard: 'Standard cleaning',
    deep: 'Deep cleaning',
    deepDesc: '+35% · Great for first time or heavily soiled',
    once: 'One time',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    discount: 'off',
    yourPrice: 'Your price',
    perCleaning: 'per cleaning',
    youSave: 'You save',
    namePH: 'Your full name',
    emailPH: 'your@email.com',
    phonePH: '(239) 000-0000',
    back: 'Back',
    next: 'Continue',
    cta: 'Confirm booking',
    trust1: 'No card now',
    trust2: 'Free cancellation',
    trust3: 'Verified professionals',
    selectDate: 'Select a date',
    selectTime: 'Select a time',
    noSlots: 'No availability on this day. Try another date.',
    loadingSlots: 'Checking availability...',
    confirmTitle: 'Booking confirmed! 🎉',
    confirmMsg: "We'll be in touch shortly to confirm the details.",
  }

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

  // ── SUCCESS screen ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-10 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: primaryColor + '20' }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">{L.confirmTitle}</h1>
          <p className="text-slate-500 mb-2">{L.confirmMsg}</p>
          {selectedSlot && (
            <p className="text-sm font-semibold text-slate-700 bg-slate-50 rounded-xl px-4 py-3 mt-4">
              📅 {fmtDayLabel(selectedDate)} · {selectedSlot.time}
            </p>
          )}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
            <p className="text-2xl font-extrabold" style={{ color: primaryColor }}>{fmtUSD(finalPrice)}</p>
            <p className="text-xs text-slate-400">{rooms.bedrooms} bed · {rooms.bathrooms} bath · {cleaningType === 'deep' ? 'Deep clean' : 'Standard'}</p>
          </div>
          <Button
            className="w-full mt-6 h-12 rounded-xl font-bold"
            style={{ backgroundColor: primaryColor }}
            onClick={() => router.push(`/t/${tenantSlug}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to home
          </Button>
        </div>
      </div>
    )
  }

  const STEPS: Step[] = [1, 2, 3, 4]
  const STEP_LABELS = [L.step1, L.step2, L.step3, L.step4]

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
      <div className="sticky top-14 z-30 border-b" style={{ backgroundColor: primaryColor }}>
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

      {/* ── Step indicators ────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
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
              {i < 3 && (
                <div
                  className="flex-1 h-0.5 rounded"
                  style={{ backgroundColor: step > s ? primaryColor : '#e2e8f0' }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-medium text-slate-400">
          {STEP_LABELS.map((l, i) => <span key={i}>{l}</span>)}
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

            {/* Cleaning type toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(['standard', 'deep'] as CleaningType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setCleaningType(t)}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                    cleaningType === t ? 'border-current bg-white shadow-sm' : 'border-slate-100 bg-slate-50'
                  }`}
                  style={cleaningType === t ? { borderColor: primaryColor } : {}}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {t === 'standard' ? <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                                      : <Zap className="w-4 h-4" style={{ color: primaryColor }} />}
                    <span className="text-sm font-bold text-slate-800">{t === 'standard' ? L.standard : L.deep}</span>
                  </div>
                  {t === 'deep' && <p className="text-xs text-slate-400">{L.deepDesc}</p>}
                </button>
              ))}
            </div>

            {/* Main counters */}
            <div className="space-y-2">
              <Counter value={rooms.bedrooms}    min={1} onChange={v => setRoom('bedrooms')(v)}    label={L.bedrooms}    icon={<BedDouble className="w-4 h-4" />} />
              <Counter value={rooms.bathrooms}   min={1} onChange={v => setRoom('bathrooms')(v)}   label={L.bathrooms}   icon={<Bath className="w-4 h-4" />} />
              <Counter value={rooms.livingRooms} min={0} onChange={v => setRoom('livingRooms')(v)} label={L.livingRooms} icon={<Home className="w-4 h-4" />} />
              <Counter value={rooms.kitchens}    min={0} onChange={v => setRoom('kitchens')(v)}    label={L.kitchens}    icon={<Home className="w-4 h-4" />} />
            </div>

            {/* Extras toggle */}
            <button
              onClick={() => setShowExtras(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold w-full py-2 text-slate-500 hover:text-slate-800"
            >
              {showExtras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {L.extras}
            </button>

            {showExtras && (
              <div className="space-y-2">
                <Counter value={rooms.offices} min={0} onChange={v => setRoom('offices')(v)} label={L.offices} icon={<Home className="w-4 h-4" />} />
                <Counter value={rooms.garages} min={0} onChange={v => setRoom('garages')(v)} label={L.garages} icon={<Home className="w-4 h-4" />} />
                {([
                  { key: 'hasLaundry', label: L.laundry },
                  { key: 'hasPool',    label: L.pool },
                  { key: 'hasPatio',   label: L.patio },
                  { key: 'hasBalcony', label: L.balcony },
                  { key: 'hasBasement', label: L.basement },
                  { key: 'hasGym',     label: L.gym },
                ] as { key: keyof RoomsState; label: string }[]).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <button
                      onClick={() => setRoom(key)(!(rooms[key] as boolean))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${rooms[key] ? 'bg-teal-500' : 'bg-slate-200'}`}
                      style={rooms[key] ? { backgroundColor: primaryColor } : {}}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${rooms[key] ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full h-12 rounded-xl font-bold text-white"
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
            </div>
            <div className="space-y-3">
              {([
                { value: 'once',     label: L.once,     icon: <CalendarDays className="w-5 h-5" />, pct: 0 },
                { value: 'weekly',   label: L.weekly,   icon: <RefreshCw className="w-5 h-5" />,    pct: config.recurringDiscounts.weekly ?? 10 },
                { value: 'biweekly', label: L.biweekly, icon: <RefreshCw className="w-5 h-5" />,    pct: config.recurringDiscounts.biweekly ?? 8 },
                { value: 'monthly',  label: L.monthly,  icon: <RefreshCw className="w-5 h-5" />,    pct: config.recurringDiscounts.monthly ?? 5 },
              ] as { value: Frequency; label: string; icon: React.ReactNode; pct: number }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    frequency === opt.value ? 'bg-white shadow-sm' : 'border-slate-100 bg-slate-50'
                  }`}
                  style={frequency === opt.value ? { borderColor: primaryColor } : {}}
                >
                  <span style={{ color: primaryColor }}>{opt.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{opt.label}</p>
                    {opt.pct > 0 && (
                      <p className="text-xs text-green-600 font-semibold mt-0.5">
                        {opt.pct}% {L.discount} · {fmtUSD(applyDiscount(priceAfterType, opt.pct))} {L.perCleaning}
                      </p>
                    )}
                  </div>
                  {frequency === opt.value && <Check className="w-5 h-5 shrink-0" style={{ color: primaryColor }} />}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-semibold" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {L.back}
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setStep(3)}
              >
                {L.next} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Date & Time ──────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{L.step3}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{L.selectDate}</p>
            </div>

            {/* Date picker — horizontal scroll */}
            <div className="overflow-x-auto pb-2 -mx-4 px-4">
              <div className="flex gap-2" style={{ width: 'max-content' }}>
                {selectableDays.map(d => {
                  const date = new Date(d + 'T12:00:00')
                  const dow  = date.toLocaleDateString('en-US', { weekday: 'short' })
                  const day  = date.getDate()
                  const mon  = date.toLocaleDateString('en-US', { month: 'short' })
                  const sel  = d === selectedDate
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`flex flex-col items-center w-14 py-3 rounded-2xl border-2 transition-all shrink-0 ${
                        sel ? 'border-current text-white shadow-md' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                      style={sel ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    >
                      <span className={`text-[10px] font-semibold uppercase ${sel ? 'text-white/70' : 'text-slate-400'}`}>{dow}</span>
                      <span className={`text-lg font-extrabold leading-none mt-1 ${sel ? 'text-white' : 'text-slate-900'}`}>{day}</span>
                      <span className={`text-[10px] font-medium mt-0.5 ${sel ? 'text-white/70' : 'text-slate-400'}`}>{mon}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">{L.selectTime}</p>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
                    <span className="ml-2 text-sm text-slate-500">{L.loadingSlots}</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-slate-100">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    {L.noSlots}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map(slot => {
                      const sel = selectedSlot?.startUtc === slot.startUtc
                      return (
                        <button
                          key={slot.startUtc}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                            sel ? 'text-white border-current' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                          style={sel ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                        >
                          {slot.time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-semibold" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {L.back}
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setStep(4)}
                disabled={!step3Done}
              >
                {L.next} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Contact ──────────────────────────────────── */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{L.step4}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {locale === 'pt' ? 'Confirme seus dados para finalizar o agendamento.'
                : locale === 'es' ? 'Confirme sus datos para finalizar la cita.'
                : 'Confirm your details to complete the booking.'}
              </p>
            </div>

            {/* Booking summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                {locale === 'pt' ? 'Resumo' : locale === 'es' ? 'Resumen' : 'Summary'}
              </p>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-700 font-medium text-sm">
                  {rooms.bedrooms} bed · {rooms.bathrooms} bath
                  {cleaningType === 'deep' ? ' · Deep' : ''}
                  {frequency !== 'once' ? ` · ${frequency}` : ''}
                </span>
                <span className="font-extrabold text-2xl text-slate-900">{fmtUSD(finalPrice)}</span>
              </div>
              {selectedSlot && (
                <p className="text-sm font-semibold text-teal-600">
                  📅 {fmtDayLabel(selectedDate)} · {selectedSlot.time}
                </p>
              )}
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
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5" />Email
                </Label>
                <Input
                  id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={L.emailPH} required
                  className="h-11 rounded-xl border-slate-200"
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
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-semibold" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {L.back}
              </Button>
              <Button
                type="submit"
                disabled={!step4Valid || submitting}
                className="flex-1 h-12 text-white font-bold rounded-xl text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>{L.cta} <ArrowRight className="w-4 h-4 ml-1" /></>
                }
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
