'use client'

import { useEffect, useState } from 'react'
import { calculatePrice } from '@/lib/pricing/calculate-price'
import { calculateDuration } from '@/lib/pricing/calculate-duration'
import { Button } from '@/components/ui/button'
import { BookingDraft } from '@/app/dashboard/bookings/new/page'
import { Plus, BedDouble, Bath, Car, Waves, Leaf, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Property {
  id: string
  nickname: string
  address: string
  city: string
  bedrooms: number
  bathrooms: number
  hasLaundry: boolean
  extraRooms: number
  hasGarage: boolean
  hasPool: boolean
  hasPatio: boolean
  calculatedPrice: string
}

interface StepPropertyProps {
  onNext: (data: Pick<BookingDraft, 'propertyId' | 'propertyNickname' | 'basePrice' | 'baseDuration'>) => void
}

function HouseIllustration({ selected }: { selected: boolean }) {
  return (
    <div className={`relative w-full h-44 rounded-xl overflow-hidden flex items-end justify-center transition-all duration-300 ${
      selected ? 'shadow-lg' : ''
    }`}>
      {/* Sky gradient */}
      <div className={`absolute inset-0 transition-all duration-300 ${
        selected
          ? 'bg-gradient-to-b from-teal-400 via-teal-300 to-emerald-200'
          : 'bg-gradient-to-b from-slate-300 via-slate-200 to-slate-100'
      }`} />

      {/* Sun */}
      <div className={`absolute top-4 right-6 rounded-full transition-all duration-300 ${
        selected ? 'w-9 h-9 bg-amber-300 shadow-[0_0_20px_6px_rgba(251,191,36,0.5)]' : 'w-7 h-7 bg-slate-300'
      }`} />

      {/* Clouds */}
      <div className={`absolute top-5 left-6 transition-all ${selected ? 'opacity-80' : 'opacity-40'}`}>
        <div className="flex items-end gap-0.5">
          <div className="w-6 h-4 bg-white rounded-full" />
          <div className="w-9 h-6 bg-white rounded-full -ml-2" />
          <div className="w-5 h-3 bg-white rounded-full -ml-2" />
        </div>
      </div>

      {/* Trees */}
      <div className="absolute bottom-8 left-5 flex items-end gap-1 z-10">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-10 rounded-full transition-colors ${selected ? 'bg-emerald-600' : 'bg-slate-400'}`} />
          <div className={`w-2 h-4 transition-colors ${selected ? 'bg-emerald-800' : 'bg-slate-500'}`} />
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-6 h-7 rounded-full transition-colors ${selected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <div className={`w-1.5 h-3 transition-colors ${selected ? 'bg-emerald-800' : 'bg-slate-500'}`} />
        </div>
      </div>

      {/* Trees right */}
      <div className="absolute bottom-8 right-5 flex items-end gap-1 z-10">
        <div className="flex flex-col items-center">
          <div className={`w-6 h-7 rounded-full transition-colors ${selected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <div className={`w-1.5 h-3 transition-colors ${selected ? 'bg-emerald-800' : 'bg-slate-500'}`} />
        </div>
        <div className="flex flex-col items-center">
          <div className={`w-8 h-10 rounded-full transition-colors ${selected ? 'bg-emerald-600' : 'bg-slate-400'}`} />
          <div className={`w-2 h-4 transition-colors ${selected ? 'bg-emerald-800' : 'bg-slate-500'}`} />
        </div>
      </div>

      {/* Ground */}
      <div className={`absolute bottom-0 left-0 right-0 h-10 transition-colors ${selected ? 'bg-emerald-600' : 'bg-slate-400'}`} />
      <div className={`absolute bottom-8 left-0 right-0 h-3 transition-colors ${selected ? 'bg-emerald-500' : 'bg-slate-300'}`} />

      {/* House body */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        {/* Roof */}
        <div className="relative">
          <div
            className={`w-0 h-0 transition-all duration-300`}
            style={{
              borderLeft: '56px solid transparent',
              borderRight: '56px solid transparent',
              borderBottom: selected ? '44px solid #0f766e' : '44px solid #94a3b8',
            }}
          />
          {/* Chimney */}
          <div className={`absolute -top-5 right-8 w-5 h-8 transition-colors ${selected ? 'bg-teal-800' : 'bg-slate-500'}`} />
          {/* Smoke */}
          {selected && (
            <div className="absolute -top-9 right-8 flex flex-col items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse delay-75" />
            </div>
          )}
        </div>
        {/* Walls */}
        <div className={`w-28 h-20 transition-colors ${selected ? 'bg-teal-100' : 'bg-slate-200'}`}>
          {/* Window left */}
          <div className={`absolute top-3 left-3 w-7 h-7 border-2 transition-colors ${selected ? 'border-teal-400 bg-amber-100' : 'border-slate-400 bg-white'}`}>
            <div className={`absolute inset-0 m-auto w-px h-full transition-colors ${selected ? 'bg-teal-400' : 'bg-slate-400'}`} />
            <div className={`absolute inset-0 m-auto h-px w-full transition-colors ${selected ? 'bg-teal-400' : 'bg-slate-400'}`} />
          </div>
          {/* Window right */}
          <div className={`absolute top-3 right-3 w-7 h-7 border-2 transition-colors ${selected ? 'border-teal-400 bg-amber-100' : 'border-slate-400 bg-white'}`}>
            <div className={`absolute inset-0 m-auto w-px h-full transition-colors ${selected ? 'bg-teal-400' : 'bg-slate-400'}`} />
            <div className={`absolute inset-0 m-auto h-px w-full transition-colors ${selected ? 'bg-teal-400' : 'bg-slate-400'}`} />
          </div>
          {/* Door */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-9 h-12 rounded-t-full border-2 transition-colors ${selected ? 'border-teal-600 bg-teal-700' : 'border-slate-500 bg-slate-400'}`}>
            <div className={`absolute top-1/2 right-2 w-1.5 h-1.5 rounded-full transition-colors ${selected ? 'bg-amber-300' : 'bg-slate-300'}`} />
          </div>
        </div>
      </div>

      {/* Selected check */}
      {selected && (
        <div className="absolute top-3 left-3 z-30 bg-teal-600 text-white rounded-full p-1 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}
    </div>
  )
}

export function StepProperty({ onNext }: StepPropertyProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then((j: { data: Property[] }) => setProperties(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  function handleNext() {
    const prop = properties.find((p) => p.id === selected)
    if (!prop) return
    const { total: price } = calculatePrice(prop)
    const duration = calculateDuration(prop)
    onNext({ propertyId: prop.id, propertyNickname: prop.nickname, basePrice: price, baseDuration: duration })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        <p className="text-sm text-slate-500">Carregando imóveis...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Selecione o imóvel</h2>
        <p className="text-slate-500 text-sm mt-1">Escolha qual casa deseja agendar a limpeza.</p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-7 h-7 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 mb-1">Nenhum imóvel cadastrado</p>
          <p className="text-sm text-slate-400 mb-4">Adicione seu primeiro imóvel para continuar</p>
          <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
            <Link href="/dashboard/properties/new">
              <Plus className="w-4 h-4 mr-2" />Adicionar imóvel
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {properties.map((p) => {
              const { total: price } = calculatePrice(p)
              const duration = calculateDuration(p)
              const hours = Math.floor(duration / 60)
              const mins = duration % 60
              const isSelected = selected === p.id

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 w-full ${
                    isSelected
                      ? 'border-teal-500 shadow-lg shadow-teal-100'
                      : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                  }`}
                >
                  {/* House illustration */}
                  <HouseIllustration selected={isSelected} />

                  {/* Info */}
                  <div className="p-4 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`font-bold text-base truncate ${isSelected ? 'text-teal-800' : 'text-slate-800'}`}>
                          {p.nickname}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{p.address}, {p.city}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-black text-lg ${isSelected ? 'text-teal-600' : 'text-slate-700'}`}>
                          ${price}
                        </p>
                        <p className="text-xs text-slate-400">{hours}h{mins > 0 ? ` ${mins}min` : ''}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-full border border-slate-100">
                        <BedDouble className="w-3 h-3" />{p.bedrooms} quartos
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-full border border-slate-100">
                        <Bath className="w-3 h-3" />{p.bathrooms} banheiros
                      </span>
                      {p.hasGarage && (
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-full border border-slate-100">
                          <Car className="w-3 h-3" />Garagem
                        </span>
                      )}
                      {p.hasPool && (
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-full border border-slate-100">
                          <Waves className="w-3 h-3" />Piscina
                        </span>
                      )}
                      {p.hasPatio && (
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-full border border-slate-100">
                          <Leaf className="w-3 h-3" />Varanda
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl border-dashed border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300"
          >
            <Link href="/dashboard/properties/new">
              <Plus className="w-4 h-4 mr-2" />Adicionar novo imóvel
            </Link>
          </Button>

          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold h-12 text-base shadow-md shadow-teal-200 disabled:opacity-40"
            disabled={!selected}
            onClick={handleNext}
          >
            Próximo: serviços adicionais <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </>
      )}
    </div>
  )
}
