'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Minus, ArrowRight, ChevronLeft, Sparkles } from 'lucide-react'

interface AddOn {
  id: string
  name: string
  description: string | null
  price: string | number
  durationMinutes: number
  icon: string | null
  category: string
}

interface StepAddOnsProps {
  basePrice: number
  baseDuration: number
  onNext: (data: { addOnIds: string[]; addOnTotal: number; addOnDuration: number }) => void
  onBack: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  kitchen: '🍳 Cozinha',
  garage: '🚗 Garagem',
  glass: '🪟 Vidros',
  outdoor: '🌿 Área externa',
  general: '✨ Geral',
}

export function StepAddOns({ basePrice, baseDuration, onNext, onBack }: StepAddOnsProps) {
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/add-ons')
      .then((r) => r.json())
      .then((d) => { setAddOns(d.addOns ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedAddOns = addOns.filter((a) => selected.has(a.id))
  const addOnTotal = selectedAddOns.reduce((sum, a) => sum + Number(a.price), 0)
  const addOnDuration = selectedAddOns.reduce((sum, a) => sum + a.durationMinutes, 0)
  const totalPrice = basePrice + addOnTotal
  const totalDuration = baseDuration + addOnDuration

  // Agrupar por categoria
  const grouped = addOns.reduce<Record<string, AddOn[]>>((acc, a) => {
    const cat = a.category ?? 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat]!.push(a)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        <p className="text-sm text-slate-500">Carregando serviços...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Serviços adicionais</h2>
        <p className="text-slate-500 text-sm mt-1">
          Opcionais que podem ser adicionados à sua limpeza. Todos são opcionais.
        </p>
      </div>

      {/* Add-ons por categoria */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {CATEGORY_LABELS[cat] ?? cat}
            </p>
            <div className="space-y-2">
              {items.map((addon) => {
                const isSelected = selected.has(addon.id)
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggle(addon.id)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-150 ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Ícone */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                        isSelected ? 'bg-teal-100' : 'bg-slate-50'
                      }`}>
                        {addon.icon ?? '✨'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isSelected ? 'text-teal-800' : 'text-slate-800'}`}>
                          {addon.name}
                        </p>
                        {addon.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{addon.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          +{addon.durationMinutes}min de duração
                        </p>
                      </div>

                      {/* Preço + toggle */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className={`font-bold text-base ${isSelected ? 'text-teal-600' : 'text-slate-700'}`}>
                            +${Number(addon.price).toFixed(2)}
                          </p>
                        </div>
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-200 text-slate-400'
                        }`}>
                          {isSelected
                            ? <Minus className="w-3.5 h-3.5" />
                            : <Plus className="w-3.5 h-3.5" />
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Resumo flutuante */}
      <Card className={`border-2 sticky bottom-4 shadow-lg ${selected.size > 0 ? 'border-teal-200 bg-teal-50/80' : 'border-slate-100 bg-white'} backdrop-blur-sm rounded-2xl`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total do agendamento</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-teal-600">${totalPrice.toFixed(2)}</p>
                {addOnTotal > 0 && (
                  <p className="text-xs text-slate-400">
                    (base ${basePrice.toFixed(2)} + extras ${addOnTotal.toFixed(2)})
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Duração estimada</p>
              <p className="font-semibold text-slate-700">
                {Math.floor(totalDuration / 60)}h{totalDuration % 60 > 0 ? ` ${totalDuration % 60}min` : ''}
              </p>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedAddOns.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full font-medium">
                  {a.icon} {a.name.split(' ').slice(0, 2).join(' ')}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onBack}
              className="rounded-xl border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onNext({ addOnIds: Array.from(selected), addOnTotal, addOnDuration })}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold"
            >
              {selected.size > 0
                ? <><Sparkles className="w-4 h-4 mr-2" />Continuar com {selected.size} extra{selected.size > 1 ? 's' : ''}</>
                : <>Continuar sem extras <ArrowRight className="w-4 h-4 ml-2" /></>
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
