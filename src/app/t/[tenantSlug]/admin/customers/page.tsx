'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, Plus, Search, Phone, Mail, Home,
  Pencil, CheckCircle2, X, Loader2, Calendar, ChevronDown, ChevronUp,
  AlertTriangle, Tag,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Property {
  id: string
  nickname: string
  address: string
  city: string
  bedrooms: number
  bathrooms: number
  calculatedPrice: string
  customPrice: string | null
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  properties: Property[]
  _count: { bookings: number }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function effectivePrice(p: Property) {
  return p.customPrice != null ? Number(p.customPrice) : Number(p.calculatedPrice)
}

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

// ─── Modal: Cadastrar cliente ─────────────────────────────────────────────────

function AddCustomerModal({ tenantSlug, onClose, onSaved }: {
  tenantSlug: string
  onClose: () => void
  onSaved: (c: Customer) => void
}) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    addProperty: true,
    propNickname: '', propAddress: '', propCity: '',
    propBedrooms: '2', propBathrooms: '1', propCustomPrice: '',
  })
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string, val: string) {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: '' }))
    setGlobalError('')
  }

  // Preço automático calculado em tempo real
  const bedrooms  = parseInt(form.propBedrooms)  || 0
  const bathrooms = parseInt(form.propBathrooms) || 0
  const autoPrice = 35 + bedrooms * 25 + bathrooms * 20

  const customPriceNum = form.propCustomPrice ? parseFloat(form.propCustomPrice) : null
  const isBelowAuto    = customPriceNum !== null && customPriceNum < autoPrice
  const isAboveAuto    = customPriceNum !== null && customPriceNum > autoPrice

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name  = 'Nome obrigatório'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email inválido'
    if (form.addProperty) {
      if (!form.propNickname.trim()) e.propNickname = 'Nome do imóvel obrigatório'
      if (!form.propAddress.trim())  e.propAddress  = 'Endereço obrigatório'
      if (!form.propCity.trim())     e.propCity     = 'Cidade obrigatória'
      if (customPriceNum !== null && customPriceNum < 1) {
        e.propCustomPrice = 'Preço mínimo é $1.00'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setGlobalError('')
    try {
      const body: Record<string, unknown> = {
        name:     form.name,
        email:    form.email,
        phone:    form.phone || undefined,
        password: form.password || undefined,
      }
      if (form.addProperty) {
        body.property = {
          nickname:    form.propNickname,
          address:     form.propAddress,
          city:        form.propCity,
          bedrooms:    parseInt(form.propBedrooms) || 1,
          bathrooms:   parseInt(form.propBathrooms) || 1,
          customPrice: customPriceNum ?? undefined,
        }
      }

      const res = await fetch(`/api/t/${tenantSlug}/customers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        const msg = json.error ?? 'Erro ao cadastrar cliente'
        if (msg.toLowerCase().includes('email')) {
          setErrors({ email: msg })
        } else {
          setGlobalError(msg)
        }
        return
      }
      onSaved(json.data)
    } catch {
      setGlobalError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Cadastrar cliente</h2>
            <p className="text-xs text-slate-400 mt-0.5">Adicione um cliente manualmente com preço personalizado</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {globalError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{globalError}</p>
            </div>
          )}
          {/* Dados pessoais */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dados do cliente</p>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nome completo *</label>
              <Input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Maria Santos" className={`h-10 rounded-xl ${errors.name ? 'border-red-400' : ''}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Email *</label>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="maria@email.com" className={`h-10 rounded-xl ${errors.email ? 'border-red-400' : ''}`} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">WhatsApp</label>
                <Input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="(239) 000-0000" className="h-10 rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Senha inicial <span className="text-slate-400 font-normal">(opcional — gerada automaticamente)</span></label>
              <Input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Mínimo 6 caracteres" className="h-10 rounded-xl" />
            </div>
          </div>

          {/* Imóvel */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.addProperty}
                onChange={e => setForm(p => ({ ...p, addProperty: e.target.checked }))}
                className="w-4 h-4 rounded text-teal-600" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Adicionar imóvel</p>
            </label>

            {form.addProperty && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Nome / apelido do imóvel *</label>
                  <Input value={form.propNickname} onChange={e => set('propNickname', e.target.value)}
                    placeholder='Ex: "Casa de Naples"' className={`h-10 rounded-xl ${errors.propNickname ? 'border-red-400' : ''}`} />
                  {errors.propNickname && <p className="text-red-500 text-xs mt-1">{errors.propNickname}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Endereço *</label>
                  <Input value={form.propAddress} onChange={e => set('propAddress', e.target.value)}
                    placeholder="1234 Palm Ave" className={`h-10 rounded-xl ${errors.propAddress ? 'border-red-400' : ''}`} />
                  {errors.propAddress && <p className="text-red-500 text-xs mt-1">{errors.propAddress}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Cidade *</label>
                    <Input value={form.propCity} onChange={e => set('propCity', e.target.value)}
                      placeholder="Naples" className={`h-10 rounded-xl ${errors.propCity ? 'border-red-400' : ''}`} />
                    {errors.propCity && <p className="text-red-500 text-xs mt-1">{errors.propCity}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Quartos</label>
                    <Input type="number" min={1} max={20} value={form.propBedrooms}
                      onChange={e => set('propBedrooms', e.target.value)} className="h-10 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Banheiros</label>
                    <Input type="number" min={1} max={20} value={form.propBathrooms}
                      onChange={e => set('propBathrooms', e.target.value)} className="h-10 rounded-xl" />
                  </div>
                </div>

                {/* Preço */}
                <div className={`rounded-xl p-4 border ${errors.propCustomPrice ? 'bg-red-50 border-red-200' : isBelowAuto ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Preço por limpeza</p>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Sugerido: <strong className="text-slate-700 ml-0.5">{fmt(autoPrice)}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <Input
                      type="number"
                      min={1}
                      step="0.01"
                      value={form.propCustomPrice}
                      onChange={e => set('propCustomPrice', e.target.value)}
                      placeholder={`${autoPrice}.00  (deixe vazio para usar o sugerido)`}
                      className={`h-11 rounded-xl pl-7 text-base font-bold ${errors.propCustomPrice ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                    />
                  </div>
                  {errors.propCustomPrice && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />{errors.propCustomPrice}
                    </p>
                  )}
                  {!errors.propCustomPrice && isBelowAuto && (
                    <p className="text-amber-600 text-xs mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Preço abaixo do sugerido — certifique-se que está correto
                    </p>
                  )}
                  {!errors.propCustomPrice && isAboveAuto && (
                    <p className="text-teal-600 text-xs mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Preço acima do sugerido ({fmt(autoPrice)})
                    </p>
                  )}
                  {!errors.propCustomPrice && customPriceNum !== null && !isBelowAuto && !isAboveAuto && (
                    <p className="text-teal-600 text-xs mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Preço personalizado: {fmt(customPriceNum)} por limpeza
                    </p>
                  )}
                  {!form.propCustomPrice && (
                    <p className="text-slate-400 text-xs mt-2">Deixe vazio para usar o preço sugerido de {fmt(autoPrice)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cadastrando...</> : <><Plus className="w-4 h-4 mr-2" />Cadastrar cliente</>}
          </Button>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Editar preço ──────────────────────────────────────────────────────

function EditPriceModal({ property, tenantSlug, customerId, onClose, onSaved }: {
  property: Property
  tenantSlug: string
  customerId: string
  onClose: () => void
  onSaved: (updatedCustomer: Customer) => void
}) {
  const current = effectivePrice(property)
  const [price, setPrice] = useState(property.customPrice ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const priceNum      = price !== '' ? parseFloat(price as string) : null
  const autoPrice     = Number(property.calculatedPrice)
  const newPrice      = priceNum !== null && !isNaN(priceNum) ? priceNum : autoPrice
  const isBelowAuto   = priceNum !== null && !isNaN(priceNum) && priceNum < autoPrice
  const isAboveAuto   = priceNum !== null && !isNaN(priceNum) && priceNum > autoPrice

  async function handleSave() {
    setLoading(true)
    setError('')
    try {
      const customPrice = price === '' ? null : priceNum
      if (customPrice !== null && (customPrice === null || isNaN(customPrice) || customPrice < 1)) {
        setError('Preço mínimo é $1.00'); setLoading(false); return
      }

      const res = await fetch(`/api/t/${tenantSlug}/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id, customPrice }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
      onSaved(json.data)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-900">Ajustar preço</h2>
            <p className="text-xs text-slate-400 mt-0.5">{property.nickname}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Preço sugerido</p>
              <p className="font-bold text-slate-700">{fmt(autoPrice)}</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3">
              <p className="text-xs text-teal-500 mb-1">Preço atual</p>
              <p className="font-bold text-teal-700">{fmt(current)}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-2">
              Novo preço <span className="text-slate-400 font-normal">(pode ser menor ou maior que o sugerido)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
              <Input
                type="number" min={1} step="0.01"
                value={price}
                onChange={e => { setPrice(e.target.value); setError('') }}
                placeholder={`${autoPrice.toFixed(2)}`}
                className={`h-12 rounded-xl pl-8 text-xl font-black ${error ? 'border-red-400' : isBelowAuto ? 'border-amber-300' : ''}`}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <X className="w-3.5 h-3.5" />{error}
              </p>
            )}
            {!error && isBelowAuto && (
              <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Preço abaixo do sugerido — você pode salvar assim mesmo
              </p>
            )}
            {!error && isAboveAuto && (
              <p className="text-teal-600 text-xs mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Preço acima do sugerido
              </p>
            )}
          </div>

          {/* Preview */}
          <div className={`rounded-xl px-4 py-3 border ${
            isBelowAuto ? 'bg-amber-50 border-amber-200' :
            price !== '' ? 'bg-teal-50 border-teal-200' :
            'bg-slate-50 border-slate-100'
          }`}>
            <p className="text-xs text-slate-400">Preço que o cliente verá</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={`text-2xl font-black ${isBelowAuto ? 'text-amber-700' : price !== '' ? 'text-teal-700' : 'text-slate-600'}`}>
                {fmt(newPrice)}
              </p>
              {price !== '' && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isBelowAuto ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                  {isBelowAuto ? '↓ desconto' : isAboveAuto ? '↑ acima' : 'personalizado'}
                </span>
              )}
            </div>
            {price !== '' && (
              <p className="text-xs text-slate-400 mt-0.5">
                Sugerido: {fmt(autoPrice)} · Diferença: {priceNum !== null ? (priceNum >= autoPrice ? '+' : '') + fmt(priceNum - autoPrice) : '—'}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar preço'}
            </Button>
          </div>

          {property.customPrice !== null && (
            <button
              onClick={() => { setPrice(''); setTimeout(handleSave, 0) }}
              className="w-full text-xs text-slate-400 hover:text-red-500 text-center transition-colors"
            >
              Remover personalização e voltar ao preço automático
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function TenantCustomersPage() {
  const params = useParams<{ tenantSlug: string }>()
  const tenantSlug = params.tenantSlug

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [showAdd, setShowAdd]     = useState(false)
  const [editPrice, setEditPrice] = useState<{ customer: Customer; property: Property } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/t/${tenantSlug}/customers`)
      const json = await res.json()
      if (json.data) setCustomers(json.data)
    } finally {
      setLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => { load() }, [load])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  )

  function handleSaved(c: Customer) {
    setCustomers(prev => {
      const idx = prev.findIndex(x => x.id === c.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = c; return next }
      return [c, ...prev]
    })
    setShowAdd(false)
    setEditPrice(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Clientes</h1>
          <p className="text-slate-400 text-sm mt-0.5">{customers.length} cliente{customers.length !== 1 ? 's' : ''} cadastrado{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold gap-2">
          <Plus className="w-4 h-4" /> Cadastrar cliente
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou telefone..."
          className="pl-9 h-11 rounded-xl border-slate-200" />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
          </p>
          {!search && (
            <Button onClick={() => setShowAdd(true)} className="mt-4 bg-teal-600 text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Cadastrar primeiro cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(customer => (
            <div key={customer.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Linha principal */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(expanded === customer.id ? null : customer.id)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{customer.name}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" />{customer.email}
                    </span>
                    {customer.phone && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{customer.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 text-sm shrink-0">
                  <div className="text-center">
                    <p className="font-bold text-slate-700">{customer._count.bookings}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5"><Calendar className="w-3 h-3" />agend.</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-700">{customer.properties.length}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5"><Home className="w-3 h-3" />imóvel</p>
                  </div>
                </div>

                {expanded === customer.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </div>

              {/* Imóveis (expandível) */}
              {expanded === customer.id && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/60">
                  {customer.properties.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">Nenhum imóvel cadastrado</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Imóveis</p>
                      {customer.properties.map(prop => {
                        const effective = effectivePrice(prop)
                        const hasCustom  = prop.customPrice !== null
                        return (
                          <div key={prop.id} className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm">{prop.nickname}</p>
                              <p className="text-xs text-slate-400 mt-0.5 truncate">{prop.address} · {prop.city}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {prop.bedrooms} quartos · {prop.bathrooms} banheiros
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="flex items-center gap-1.5">
                                  <p className={`font-black text-lg ${hasCustom ? 'text-teal-700' : 'text-slate-700'}`}>
                                    {fmt(effective)}
                                  </p>
                                  {hasCustom && (
                                    <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-1.5 py-0.5 rounded-full">
                                      personalizado
                                    </span>
                                  )}
                                </div>
                                {hasCustom && (
                                  <p className="text-[11px] text-slate-400 text-right">
                                    automático: {fmt(Number(prop.calculatedPrice))}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditPrice({ customer, property: prop })}
                                className="rounded-xl gap-1.5 text-xs h-8"
                              >
                                <Pencil className="w-3 h-3" /> Ajustar preço
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      {showAdd && (
        <AddCustomerModal
          tenantSlug={tenantSlug}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}
      {editPrice && (
        <EditPriceModal
          property={editPrice.property}
          tenantSlug={tenantSlug}
          customerId={editPrice.customer.id}
          onClose={() => setEditPrice(null)}
          onSaved={c => { handleSaved(c); setExpanded(c.id) }}
        />
      )}
    </div>
  )
}
