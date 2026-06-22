'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users2,
  Plus,
  X,
  Loader2,
  Pencil,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Circle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string
  name: string
  color: string
  isActive: boolean
  createdAt: string
  totalBookings: number
  bookingsThisMonth: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TEAM_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEAM_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
          style={{
            backgroundColor: color,
            borderColor: value === color ? '#0f172a' : 'transparent',
          }}
          aria-label={`Selecionar cor ${color}`}
        />
      ))}
    </div>
  )
}

interface TeamModalProps {
  tenantSlug: string
  editingTeam: Team | null
  onClose: () => void
  onSaved: (team: Team) => void
}

function TeamModal({ tenantSlug, editingTeam, onClose, onSaved }: TeamModalProps) {
  const [name, setName] = useState(editingTeam?.name ?? '')
  const [color, setColor] = useState(editingTeam?.color ?? TEAM_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = editingTeam !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const url = isEditing
        ? `/api/t/${tenantSlug}/teams/${editingTeam.id}`
        : `/api/t/${tenantSlug}/teams`

      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      })

      const json: { success: boolean; data?: Team; error?: string } = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error ?? 'Erro ao salvar equipe')
        return
      }

      if (json.data) onSaved(json.data)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Editar equipe' : 'Nova equipe'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Preview */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: color }}
            >
              {name ? getInitial(name) : '?'}
            </div>
            <span className="text-sm text-gray-500">Prévia da equipe</span>
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="team-name">
              Nome da equipe
            </label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Equipe A, Turma da Manhã…"
              maxLength={50}
              required
              autoFocus
            />
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Cor</span>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                'Salvar alterações'
              ) : (
                'Criar equipe'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const params = useParams<{ tenantSlug: string }>()
  const tenantSlug = params.tenantSlug

  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/t/${tenantSlug}/teams`)
      const json: { success: boolean; data?: Team[]; error?: string } = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Erro ao carregar equipes')
        return
      }
      setTeams(json.data ?? [])
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  function openCreate() {
    setEditingTeam(null)
    setModalOpen(true)
  }

  function openEdit(team: Team) {
    setEditingTeam(team)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingTeam(null)
  }

  function handleSaved(saved: Team) {
    setTeams((prev) => {
      const exists = prev.find((t) => t.id === saved.id)
      if (exists) {
        return prev.map((t) =>
          t.id === saved.id ? { ...t, ...saved } : t
        )
      }
      // Nova equipe — adiciona com contagens zeradas (já vem do backend)
      return [...prev, saved]
    })
    closeModal()
  }

  async function toggleActive(team: Team) {
    setTogglingId(team.id)
    try {
      const res = await fetch(`/api/t/${tenantSlug}/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !team.isActive }),
      })
      const json: { success: boolean; data?: Team; error?: string } = await res.json()
      if (res.ok && json.success && json.data) {
        setTeams((prev) =>
          prev.map((t) => (t.id === team.id ? { ...t, isActive: json.data!.isActive } : t))
        )
      }
    } catch {
      // falha silenciosa — estado não muda
    } finally {
      setTogglingId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as equipes de limpeza da empresa
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Nova equipe
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && teams.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <Users2 className="h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-700">Nenhuma equipe cadastrada</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-xs">
            Crie a primeira equipe para começar a atribuir agendamentos.
          </p>
          <Button
            onClick={openCreate}
            className="mt-5 bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Criar primeira equipe
          </Button>
        </div>
      )}

      {/* Teams grid */}
      {!loading && !error && teams.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              toggling={togglingId === team.id}
              onEdit={() => openEdit(team)}
              onToggle={() => toggleActive(team)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <TeamModal
          tenantSlug={tenantSlug}
          editingTeam={editingTeam}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

// ── Team Card ─────────────────────────────────────────────────────────────────

interface TeamCardProps {
  team: Team
  toggling: boolean
  onEdit: () => void
  onToggle: () => void
}

function TeamCard({ team, toggling, onEdit, onToggle }: TeamCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Avatar + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-bold text-lg"
            style={{ backgroundColor: team.color }}
          >
            {getInitial(team.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{team.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              {team.isActive ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600">Ativa</span>
                </>
              ) : (
                <>
                  <Circle className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-400">Inativa</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bookings count */}
      <p className="mt-4 text-sm text-gray-500">
        <span className="font-semibold text-gray-800">{team.bookingsThisMonth}</span>{' '}
        agendamento{team.bookingsThisMonth !== 1 ? 's' : ''} este mês
      </p>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex-1 gap-1.5 rounded-xl text-xs"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          disabled={toggling}
          className={`flex-1 gap-1.5 rounded-xl text-xs ${
            team.isActive
              ? 'text-gray-600 hover:text-red-600 hover:border-red-200'
              : 'text-teal-700 hover:border-teal-300'
          }`}
        >
          {toggling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : team.isActive ? (
            <>
              <ToggleRight className="h-3.5 w-3.5" />
              Desativar
            </>
          ) : (
            <>
              <ToggleLeft className="h-3.5 w-3.5" />
              Ativar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
