'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { propertySchema, PROPERTY_CITIES } from '@/lib/validation/schemas/property'
import type { z } from 'zod'

type PropertyInput = z.output<typeof propertySchema>
import { calculatePrice } from '@/lib/pricing/calculate-price'
import { calculateDuration } from '@/lib/pricing/calculate-duration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RoomPicker } from '@/components/property/RoomPicker'
import { toast } from 'sonner'
import { Clock, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4

interface StepInfo {
  id: StepId
  label: string
}

const STEPS: StepInfo[] = [
  { id: 1, label: 'Identificação' },
  { id: 2, label: 'Cômodos' },
  { id: 3, label: 'Acesso' },
  { id: 4, label: 'Áreas' },
]

// ─── Property Type Options ───────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: 'house',     emoji: '🏠', label: 'Casa' },
  { value: 'apartment', emoji: '🏢', label: 'Apartamento' },
  { value: 'condo',     emoji: '🏙️', label: 'Condomínio' },
  { value: 'office',    emoji: '💼', label: 'Escritório' },
] as const

// ─── Access Type Options ─────────────────────────────────────────────────────

const ACCESS_TYPES = [
  { value: 'client_present', emoji: '👤', label: 'Estarei presente',    showCode: false, showNotes: false },
  { value: 'lockbox',        emoji: '🔑', label: 'Lockbox',             showCode: true,  showNotes: false, codeLabel: 'Código do Lockbox' },
  { value: 'gate_code',      emoji: '🔢', label: 'Código do portão',    showCode: true,  showNotes: false, codeLabel: 'Código do portão' },
  { value: 'key_hidden',     emoji: '🗝️', label: 'Chave escondida',     showCode: false, showNotes: true  },
  { value: 'doorman',        emoji: '🚪', label: 'Porteiro / Doorman',  showCode: false, showNotes: true  },
  { value: 'other',          emoji: '📝', label: 'Outro',               showCode: false, showNotes: true  },
] as const

// ─── Cleaning Areas Helper ───────────────────────────────────────────────────

interface CleaningAreaOption {
  key: string
  label: string
  emoji: string
}

function getAvailableCleaningAreas(watched: Partial<PropertyInput>): CleaningAreaOption[] {
  const areas: CleaningAreaOption[] = []

  if ((watched.bedrooms ?? 0) > 0)    areas.push({ key: 'quartos',          label: 'Quartos',          emoji: '🛏️' })
  if ((watched.bathrooms ?? 0) > 0)   areas.push({ key: 'banheiros',        label: 'Banheiros',        emoji: '🚿' })
  if ((watched.livingRooms ?? 0) > 0) areas.push({ key: 'sala de estar',    label: 'Sala de estar',    emoji: '🛋️' })
  if ((watched.diningRooms ?? 0) > 0) areas.push({ key: 'sala de jantar',   label: 'Sala de jantar',   emoji: '🍽️' })
  if ((watched.kitchens ?? 0) > 0)    areas.push({ key: 'cozinha',          label: 'Cozinha',          emoji: '🍳' })
  if ((watched.offices ?? 0) > 0)     areas.push({ key: 'escritório',       label: 'Escritório',       emoji: '💼' })
  if ((watched.garages ?? 0) > 0)     areas.push({ key: 'garagem',          label: 'Garagem',          emoji: '🚗' })
  if (watched.hasLaundry)             areas.push({ key: 'lavanderia',       label: 'Lavanderia',       emoji: '🧺' })
  if (watched.hasPool)                areas.push({ key: 'área da piscina',  label: 'Área da piscina',  emoji: '🏊' })
  if (watched.hasPatio)               areas.push({ key: 'pátio',            label: 'Pátio',            emoji: '🌿' })
  if (watched.hasBalcony)             areas.push({ key: 'varanda',          label: 'Varanda',          emoji: '🌅' })
  if (watched.hasBasement)            areas.push({ key: 'porão',            label: 'Porão',            emoji: '🏚️' })
  if (watched.hasAttic)               areas.push({ key: 'sótão',            label: 'Sótão',            emoji: '🏠' })
  if (watched.hasGym)                 areas.push({ key: 'academia',         label: 'Academia',         emoji: '🏋️' })
  if (watched.hasGameRoom)            areas.push({ key: 'sala de jogos',    label: 'Sala de jogos',    emoji: '🎮' })

  return areas
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: StepId }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${current === step.id
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                  : current > step.id
                    ? 'bg-teal-100 text-teal-700 border-2 border-teal-400'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                }`}
            >
              {current > step.id ? '✓' : step.id}
            </div>
            <span
              className={`text-xs mt-1 font-medium
                ${current === step.id ? 'text-teal-700' : current > step.id ? 'text-teal-500' : 'text-gray-400'}`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`w-12 h-0.5 mb-5 transition-all
                ${current > step.id ? 'bg-teal-400' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Price Summary Card ───────────────────────────────────────────────────────

function PriceSummaryCard({ watched }: { watched: PropertyInput }) {
  const breakdown = calculatePrice(watched)
  const duration = calculateDuration(watched)
  const hours = Math.floor(duration / 60)
  const mins = duration % 60

  return (
    <Card className="bg-gradient-to-br from-teal-600 to-teal-700 border-0 text-white overflow-hidden sticky top-6">
      <CardContent className="p-5">
        <p className="text-teal-200 text-xs font-medium uppercase tracking-wide">Preço estimado</p>
        <p className="text-5xl font-bold mt-1">${breakdown.total}</p>
        <div className="flex items-center gap-1.5 mt-2 text-teal-200 text-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>{hours}h{mins > 0 ? ` ${mins}min` : ''} de serviço</span>
        </div>

        <div className="mt-4 pt-4 border-t border-teal-500/50 space-y-1 text-xs text-teal-100">
          <div className="flex justify-between"><span>Base</span><span>${breakdown.base}</span></div>
          {breakdown.bedrooms > 0    && <div className="flex justify-between"><span>🛏️ {watched.bedrooms}x quartos</span><span>+${breakdown.bedrooms}</span></div>}
          {breakdown.bathrooms > 0   && <div className="flex justify-between"><span>🚿 {watched.bathrooms}x banheiros</span><span>+${breakdown.bathrooms}</span></div>}
          {breakdown.livingRooms > 0 && <div className="flex justify-between"><span>🛋️ {watched.livingRooms}x sala(s)</span><span>+${breakdown.livingRooms}</span></div>}
          {breakdown.kitchens > 0    && <div className="flex justify-between"><span>🍳 {watched.kitchens}x cozinha(s)</span><span>+${breakdown.kitchens}</span></div>}
          {breakdown.diningRooms > 0 && <div className="flex justify-between"><span>🍽️ {watched.diningRooms}x jantar</span><span>+${breakdown.diningRooms}</span></div>}
          {breakdown.offices > 0     && <div className="flex justify-between"><span>💼 {watched.offices}x escritório(s)</span><span>+${breakdown.offices}</span></div>}
          {breakdown.garages > 0     && <div className="flex justify-between"><span>🚗 {watched.garages}x garagem</span><span>+${breakdown.garages}</span></div>}
          {breakdown.laundry > 0     && <div className="flex justify-between"><span>🧺 Lavanderia</span><span>+${breakdown.laundry}</span></div>}
          {breakdown.pool > 0        && <div className="flex justify-between"><span>🏊 Piscina</span><span>+${breakdown.pool}</span></div>}
          {breakdown.patio > 0       && <div className="flex justify-between"><span>🌿 Pátio</span><span>+${breakdown.patio}</span></div>}
          {breakdown.balcony > 0     && <div className="flex justify-between"><span>🌅 Varanda</span><span>+${breakdown.balcony}</span></div>}
          {breakdown.basement > 0    && <div className="flex justify-between"><span>🏚️ Porão</span><span>+${breakdown.basement}</span></div>}
          {breakdown.attic > 0       && <div className="flex justify-between"><span>🏠 Sótão</span><span>+${breakdown.attic}</span></div>}
          {breakdown.gym > 0         && <div className="flex justify-between"><span>🏋️ Academia</span><span>+${breakdown.gym}</span></div>}
          {breakdown.gameRoom > 0    && <div className="flex justify-between"><span>🎮 Sala jogos</span><span>+${breakdown.gameRoom}</span></div>}
          <div className="flex justify-between font-bold text-white pt-2 border-t border-teal-500/50 mt-2">
            <span>Total</span><span>${breakdown.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const router = useRouter()
  const [step, setStep] = useState<StepId>(1)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<PropertyInput>({
      resolver: zodResolver(propertySchema) as Resolver<PropertyInput>,
      defaultValues: {
        propertyType: 'house',
        accessType:   'client_present',
        cleaningAreas: [],
        bedrooms: 3, bathrooms: 2, livingRooms: 1, diningRooms: 0,
        kitchens: 1, offices: 0, garages: 0,
        hasLaundry: false, hasPool: false, hasPatio: false,
        hasBalcony: false, hasBasement: false, hasAttic: false,
        hasGym: false, hasGameRoom: false,
        extraRooms: 0, hasGarage: false,
        accessCode: '',
        accessNotes: '',
        cleaningNotes: '',
      },
    })

  const watched = watch()

  const availableAreas = useMemo(() => getAvailableCleaningAreas(watched), [
    watched.bedrooms, watched.bathrooms, watched.livingRooms, watched.diningRooms,
    watched.kitchens, watched.offices, watched.garages, watched.hasLaundry,
    watched.hasPool, watched.hasPatio, watched.hasBalcony, watched.hasBasement,
    watched.hasAttic, watched.hasGym, watched.hasGameRoom,
  ])

  const selectedAreas = watched.cleaningAreas ?? []

  const currentAccessType = ACCESS_TYPES.find(a => a.value === watched.accessType)

  function toggleArea(areaKey: string) {
    const current = watched.cleaningAreas ?? []
    const next = current.includes(areaKey)
      ? current.filter(k => k !== areaKey)
      : [...current, areaKey]
    setValue('cleaningAreas', next)
  }

  function selectAllAreas() {
    setValue('cleaningAreas', availableAreas.map(a => a.key))
  }

  function clearAllAreas() {
    setValue('cleaningAreas', [])
  }

  async function onSubmit(data: PropertyInput) {
    setLoading(true)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json: { success: boolean; error?: string } = await res.json()
      if (!json.success) { toast.error(json.error ?? 'Erro ao salvar'); return }
      toast.success('Imóvel cadastrado com sucesso!')
      router.push('/dashboard/properties')
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const roomsWithQty = [
    { key: 'bedrooms',    label: 'Quartos',                   emoji: '🛏️', value: watched.bedrooms    ?? 0, min: 1, onChange: (v: number) => setValue('bedrooms',    v) },
    { key: 'bathrooms',   label: 'Banheiros',                 emoji: '🚿', value: watched.bathrooms   ?? 0, min: 1, onChange: (v: number) => setValue('bathrooms',   v) },
    { key: 'livingRooms', label: 'Salas de estar',            emoji: '🛋️', value: watched.livingRooms ?? 0, min: 0, onChange: (v: number) => setValue('livingRooms', v) },
    { key: 'diningRooms', label: 'Salas de jantar',           emoji: '🍽️', value: watched.diningRooms ?? 0, min: 0, onChange: (v: number) => setValue('diningRooms', v) },
    { key: 'kitchens',    label: 'Cozinhas',                  emoji: '🍳', value: watched.kitchens    ?? 0, min: 0, onChange: (v: number) => setValue('kitchens',    v) },
    { key: 'offices',     label: 'Escritórios / Home Office', emoji: '💼', value: watched.offices     ?? 0, min: 0, onChange: (v: number) => setValue('offices',     v) },
    { key: 'garages',     label: 'Vagas de garagem',          emoji: '🚗', value: watched.garages     ?? 0, min: 0, onChange: (v: number) => setValue('garages',     v) },
  ]

  const toggleRooms = [
    { key: 'hasLaundry',  label: 'Lavanderia',       emoji: '🧺', description: 'Área de lavar roupa',   checked: watched.hasLaundry  ?? false, onChange: (v: boolean) => setValue('hasLaundry',  v) },
    { key: 'hasPool',     label: 'Área da piscina',  emoji: '🏊', description: 'Piscina e deck',        checked: watched.hasPool     ?? false, onChange: (v: boolean) => setValue('hasPool',     v) },
    { key: 'hasPatio',    label: 'Pátio / quintal',  emoji: '🌿', description: 'Área externa',          checked: watched.hasPatio    ?? false, onChange: (v: boolean) => setValue('hasPatio',    v) },
    { key: 'hasBalcony',  label: 'Varanda / sacada', emoji: '🌅', description: 'Área aberta no andar',  checked: watched.hasBalcony  ?? false, onChange: (v: boolean) => setValue('hasBalcony',  v) },
    { key: 'hasBasement', label: 'Porão / subsolo',  emoji: '🏚️', description: 'Abaixo do nível',      checked: watched.hasBasement ?? false, onChange: (v: boolean) => setValue('hasBasement', v) },
    { key: 'hasAttic',    label: 'Sótão',            emoji: '🏠', description: 'Acima do teto',         checked: watched.hasAttic    ?? false, onChange: (v: boolean) => setValue('hasAttic',    v) },
    { key: 'hasGym',      label: 'Academia / Gym',   emoji: '🏋️', description: 'Sala de exercícios',   checked: watched.hasGym      ?? false, onChange: (v: boolean) => setValue('hasGym',      v) },
    { key: 'hasGameRoom', label: 'Sala de jogos',    emoji: '🎮', description: 'Home theater / games', checked: watched.hasGameRoom ?? false, onChange: (v: boolean) => setValue('hasGameRoom', v) },
  ]

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Adicionar imóvel</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha as informações do imóvel para calcular o preço da limpeza</p>
      </div>

      <StepIndicator current={step} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-6 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* ─── Step 1: Tipo e Identificação ─────────────────────────── */}
            {step === 1 && (
              <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Tipo e Identificação</h2>
                    <p className="text-sm text-gray-500">Escolha o tipo do imóvel e dê um nome para identificá-lo</p>
                  </div>

                  {/* Property type selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo do imóvel</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {PROPERTY_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setValue('propertyType', type.value)}
                          className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all gap-2
                            ${watched.propertyType === type.value
                              ? 'border-teal-500 bg-teal-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          <span className="text-3xl">{type.emoji}</span>
                          <span className={`text-sm font-semibold ${watched.propertyType === type.value ? 'text-teal-700' : 'text-gray-700'}`}>
                            {type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nickname */}
                  <div className="space-y-1.5">
                    <Label htmlFor="nickname">Nome do imóvel</Label>
                    <Input
                      id="nickname"
                      placeholder="Ex: Minha Casa Fort Myers"
                      {...register('nickname')}
                      className={errors.nickname ? 'border-red-400' : ''}
                    />
                    {errors.nickname && <p className="text-red-500 text-xs">{errors.nickname.message}</p>}
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      placeholder="1234 Palm Ave"
                      {...register('address')}
                      className={errors.address ? 'border-red-400' : ''}
                    />
                    {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <Label>Cidade</Label>
                    <Select
                      defaultValue={watched.city}
                      onValueChange={(v) => { if (v) setValue('city', v) }}
                    >
                      <SelectTrigger className={errors.city ? 'border-red-400' : ''}>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Step 2: Cômodos e Áreas ──────────────────────────────── */}
            {step === 2 && (
              <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Cômodos e Áreas</h2>
                    <p className="text-sm text-gray-500">Informe os ambientes do imóvel para calcular o preço</p>
                  </div>
                  <RoomPicker roomsWithQty={roomsWithQty} toggleRooms={toggleRooms} />
                </CardContent>
              </Card>
            )}

            {/* ─── Step 3: Acesso ao imóvel ─────────────────────────────── */}
            {step === 3 && (
              <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Acesso ao imóvel</h2>
                    <p className="text-sm text-gray-500">Como nossa equipe irá acessar o imóvel no dia da limpeza?</p>
                  </div>

                  {/* Access type grid */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de acesso</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ACCESS_TYPES.map((access) => (
                        <button
                          key={access.value}
                          type="button"
                          onClick={() => setValue('accessType', access.value)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all
                            ${watched.accessType === access.value
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                          <span className="text-2xl">{access.emoji}</span>
                          <span className={`text-sm font-medium ${watched.accessType === access.value ? 'text-teal-700' : 'text-gray-700'}`}>
                            {access.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Access code — shown for lockbox and gate_code */}
                  {currentAccessType && 'showCode' in currentAccessType && currentAccessType.showCode && (
                    <div className="space-y-1.5">
                      <Label htmlFor="accessCode">
                        {'codeLabel' in currentAccessType ? currentAccessType.codeLabel : 'Código de acesso'}
                      </Label>
                      <Input
                        id="accessCode"
                        placeholder="Ex: 1234"
                        {...register('accessCode')}
                      />
                    </div>
                  )}

                  {/* Access notes — shown for key_hidden, doorman, other */}
                  {currentAccessType && 'showNotes' in currentAccessType && currentAccessType.showNotes && (
                    <div className="space-y-1.5">
                      <Label htmlFor="accessNotes">Instruções de acesso</Label>
                      <Textarea
                        id="accessNotes"
                        placeholder="Ex: chave embaixo do tapete da entrada, porteiro se chama João, etc."
                        rows={3}
                        {...register('accessNotes')}
                      />
                    </div>
                  )}

                  {/* Cleaning notes — always visible */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cleaningNotes">Observações especiais de limpeza</Label>
                    <Textarea
                      id="cleaningNotes"
                      placeholder="Ex: tenho cachorro, não limpar o escritório, alergia a produtos com cloro..."
                      rows={4}
                      {...register('cleaningNotes')}
                    />
                    <p className="text-xs text-gray-400">Opcional — informe pets, alergias, áreas a evitar, etc.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Step 4: Áreas de limpeza ─────────────────────────────── */}
            {step === 4 && (
              <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Áreas específicas de limpeza</h2>
                    <p className="text-sm text-gray-500">
                      Selecione apenas as áreas que deseja incluir nesta limpeza. Se não selecionar nenhuma, todas as áreas serão limpas.
                    </p>
                  </div>

                  {/* Select all / Clear buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllAreas}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
                    >
                      Selecionar todas
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      type="button"
                      onClick={clearAllAreas}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2"
                    >
                      Limpar seleção
                    </button>
                    {selectedAreas.length > 0 && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{selectedAreas.length} selecionadas</span>
                      </>
                    )}
                  </div>

                  {availableAreas.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                      <p className="text-4xl mb-2">🏠</p>
                      <p className="text-sm">Nenhuma área disponível. Volte ao passo 2 e adicione cômodos.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableAreas.map((area) => {
                        const isSelected = selectedAreas.includes(area.key)
                        return (
                          <button
                            key={area.key}
                            type="button"
                            onClick={() => toggleArea(area.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-medium transition-all
                              ${isSelected
                                ? 'border-teal-500 bg-teal-50 text-teal-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                          >
                            <span>{area.emoji}</span>
                            <span>{area.label}</span>
                            {isSelected && <span className="text-teal-500 text-xs ml-0.5">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {selectedAreas.length === 0 && (
                    <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Nenhuma área selecionada — todas as áreas do imóvel serão limpas.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ─── Navigation buttons ───────────────────────────────────── */}
            <div className="flex justify-between mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1) as StepId)}
                disabled={step === 1}
                className="gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>

              {step < 4 ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => Math.min(4, s + 1) as StepId)}
                  className="bg-teal-600 hover:bg-teal-700 gap-1.5"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 px-8"
                  disabled={loading}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar imóvel'}
                </Button>
              )}
            </div>
          </div>

          {/* ─── Sticky price summary (right side) ──────────────────────── */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <PriceSummaryCard watched={watched} />

            {/* Step hint */}
            <p className="text-xs text-gray-400 text-center mt-3">
              Passo {step} de {STEPS.length}
            </p>
          </div>
        </div>

        {/* Mobile price bar */}
        <div className="lg:hidden mt-4">
          <MobilePriceBar watched={watched} />
        </div>
      </form>
    </div>
  )
}

// ─── Mobile Price Bar ─────────────────────────────────────────────────────────

function MobilePriceBar({ watched }: { watched: PropertyInput }) {
  const breakdown = calculatePrice(watched)
  const duration = calculateDuration(watched)
  const hours = Math.floor(duration / 60)
  const mins = duration % 60

  return (
    <div className="bg-teal-600 text-white rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <DollarSign className="w-5 h-5 text-teal-200" />
        <div>
          <p className="text-xs text-teal-200">Preço estimado</p>
          <p className="text-xl font-bold">${breakdown.total}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-teal-200 text-sm">
        <Clock className="w-4 h-4" />
        <span>{hours}h{mins > 0 ? `${mins}m` : ''}</span>
      </div>
    </div>
  )
}
