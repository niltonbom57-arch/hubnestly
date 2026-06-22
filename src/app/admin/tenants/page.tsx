'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2, Search, Users, Calendar, Clock, CheckCircle2,
  XCircle, AlertTriangle, Loader2, Pencil, X, ExternalLink,
  RefreshCw, Sparkles,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
type TenantPlan   = 'STARTER' | 'PRO' | 'SCALE'

interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  plan: TenantPlan
  trialEndsAt: string | null
  createdAt: string
  _count: { users: number; bookings: number }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const STATUS_CONFIG: Record<TenantStatus, { label: string; color: string; icon: React.ReactNode }> = {
  TRIAL:     { label: 'Trial',     color: 'bg-amber-100 text-amber-700',  icon: <Clock className="w-3.5 h-3.5" /> },
  ACTIVE:    { label: 'Ativo',     color: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  SUSPENDED: { label: 'Suspenso',  color: 'bg-red-100 text-red-700',      icon: <XCircle className="w-3.5 h-3.5" /> },
  CANCELLED: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500',  icon: <XCircle className="w-3.5 h-3.5" /> },
}

const PLAN_CONFIG: Record<TenantPlan, { label: string; color: string; fee: string }> = {
  STARTER: { label: 'Starter', color: 'bg-slate-100 text-slate-700',   fee: '8%' },
  PRO:     { label: 'Pro',     color: 'bg-teal-100 text-teal-700',     fee: '5%' },
  SCALE:   { label: 'Scale',   color: 'bg-violet-100 text-violet-700', fee: '3%' },
}

// ─── Modal: Ajustar trial / status ────────────────────────────────────────────

function EditTrialModal({ tenant, onClose, onSaved }: {
  tenant: Tenant
  onClose: () => void
  onSaved: (t: Tenant) => void
}) {
  const days = daysLeft(tenant.trialEndsAt)

  const [trialDays, setTrialDays]   = useState<string>(days != null ? String(Math.max(days, 0)) : '14')
  const [status, setStatus]         = useState<TenantStatus>(tenant.status)
  const [plan, setPlan]             = useState<TenantPlan>(tenant.plan)
  const [unlimited, setUnlimited]   = useState(tenant.trialEndsAt === null && tenant.status === 'TRIAL')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  async function handleSave() {
    setLoading(true); setError('')
    try {
      const body: Record<string, unknown> = { status, plan }

      if (status === 'TRIAL') {
        body.trialDays = unlimited ? null : (parseInt(trialDays) || 14)
      }

      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
      onSaved(json.data)
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  // Data prevista de expiração (preview)
  const previewDate = !unlimited && status === 'TRIAL'
    ? new Date(Date.now() + (parseInt(trialDays) || 0) * 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">Gerenciar empresa</h2>
            <p className="text-xs text-slate-400 mt-0.5">{tenant.name} · <span className="font-mono">hubnestly.com/t/{tenant.slug}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Status da conta</label>
            <div className="grid grid-cols-2 gap-2">
              {(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'] as TenantStatus[]).map(s => {
                const c = STATUS_CONFIG[s]
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      status === s
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {c.icon} {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Plano */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Plano</label>
            <div className="grid grid-cols-3 gap-2">
              {(['STARTER', 'PRO', 'SCALE'] as TenantPlan[]).map(p => {
                const c = PLAN_CONFIG[p]
                return (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    className={`flex flex-col items-center px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      plan === p
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="text-xs font-normal opacity-70">{c.fee}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Período de trial (só visível se status = TRIAL) */}
          {status === 'TRIAL' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Período de trial</label>

              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unlimited}
                  onChange={e => setUnlimited(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600"
                />
                <span className="text-sm text-slate-600 font-medium">Trial ilimitado (sem expiração)</span>
              </label>

              {!unlimited && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        value={trialDays}
                        onChange={e => setTrialDays(e.target.value)}
                        className="h-11 rounded-xl pr-16 text-lg font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">dias</span>
                    </div>
                    {/* Atalhos rápidos */}
                    <div className="flex gap-1">
                      {[7, 14, 30, 60].map(d => (
                        <button
                          key={d}
                          onClick={() => setTrialDays(String(d))}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            trialDays === String(d) ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  {previewDate && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Trial expira em: <strong className="text-slate-700">{previewDate}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminTenantsPage() {
  const [tenants, setTenants]   = useState<Tenant[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/tenants')
      const json = await res.json()
      if (json.data) setTenants(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:     tenants.length,
    trial:     tenants.filter(t => t.status === 'TRIAL').length,
    active:    tenants.filter(t => t.status === 'ACTIVE').length,
    expiring:  tenants.filter(t => {
      const d = daysLeft(t.trialEndsAt)
      return t.status === 'TRIAL' && d !== null && d <= 3 && d >= 0
    }).length,
  }

  function handleSaved(updated: Tenant) {
    setTenants(prev => prev.map(t => t.id === updated.id ? updated : t))
    setEditingId(null)
  }

  const editing = editingId ? tenants.find(t => t.id === editingId) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Empresas cadastradas</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie trials, planos e status de cada empresa</p>
        </div>
        <Button onClick={load} variant="outline" className="rounded-xl gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total de empresas', value: stats.total,    color: 'text-slate-800',  bg: 'bg-slate-50',  icon: <Building2 className="w-5 h-5 text-slate-500" /> },
          { label: 'Em trial',          value: stats.trial,    color: 'text-amber-700',  bg: 'bg-amber-50',  icon: <Clock className="w-5 h-5 text-amber-500" /> },
          { label: 'Ativas',            value: stats.active,   color: 'text-green-700',  bg: 'bg-green-50',  icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
          { label: 'Trial expirando',   value: stats.expiring, color: 'text-red-700',    bg: 'bg-red-50',    icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <div className="flex items-center justify-between mb-2">{s.icon}</div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou slug..."
          className="pl-9 h-11 rounded-xl border-slate-200" />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(tenant => {
                const days = daysLeft(tenant.trialEndsAt)
                const sc   = STATUS_CONFIG[tenant.status]
                const pc   = PLAN_CONFIG[tenant.plan]
                const isExpiringSoon  = tenant.status === 'TRIAL' && days !== null && days <= 3 && days >= 0
                const isExpired       = tenant.status === 'TRIAL' && days !== null && days < 0

                return (
                  <div key={tenant.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-slate-50 transition-colors ${isExpiringSoon ? 'border-l-4 border-l-orange-400' : ''} ${isExpired ? 'border-l-4 border-l-red-400 opacity-80' : ''}`}>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900">{tenant.name}</p>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>
                          {sc.icon}{sc.label}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pc.color}`}>
                          {pc.label} · {pc.fee}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">hubnestly.com/t/{tenant.slug}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tenant._count.users} usuários</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{tenant._count.bookings} agendamentos</span>
                        <span>Cadastro: {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Trial info */}
                    <div className="shrink-0 text-right min-w-[130px]">
                      {tenant.status === 'TRIAL' && (
                        <div className={`rounded-xl px-3 py-2 text-center ${
                          isExpired       ? 'bg-red-50 border border-red-200' :
                          isExpiringSoon  ? 'bg-orange-50 border border-orange-200' :
                          days === null   ? 'bg-teal-50 border border-teal-200' :
                                            'bg-amber-50 border border-amber-100'
                        }`}>
                          {days === null ? (
                            <>
                              <p className="text-teal-600 font-black text-sm flex items-center justify-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> Ilimitado
                              </p>
                              <p className="text-teal-500 text-[10px]">sem expiração</p>
                            </>
                          ) : isExpired ? (
                            <>
                              <p className="text-red-600 font-black text-sm">Expirado</p>
                              <p className="text-red-400 text-[10px]">há {Math.abs(days)} dia{Math.abs(days) !== 1 ? 's' : ''}</p>
                            </>
                          ) : (
                            <>
                              <p className={`font-black text-sm ${isExpiringSoon ? 'text-orange-700' : 'text-amber-700'}`}>
                                {days} dia{days !== 1 ? 's' : ''}
                              </p>
                              <p className={`text-[10px] ${isExpiringSoon ? 'text-orange-500' : 'text-amber-500'}`}>restantes</p>
                            </>
                          )}
                        </div>
                      )}
                      {tenant.status === 'ACTIVE' && (
                        <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-center">
                          <p className="text-green-700 font-black text-sm">Ativo</p>
                          <p className="text-green-500 text-[10px]">pago</p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/t/${tenant.slug}/admin`}
                        target="_blank"
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        title="Ver painel da empresa"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => setEditingId(tenant.id)}
                        className="rounded-xl gap-1.5 text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Pencil className="w-3 h-3" /> Gerenciar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditTrialModal
          tenant={editing}
          onClose={() => setEditingId(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
