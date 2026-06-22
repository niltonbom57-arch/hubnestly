'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  propertyId: string
  propertyName: string
}

export function PropertyActions({ propertyId, propertyName }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, startDelete] = useTransition()

  function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    startDelete(async () => {
      const res = await fetch(`/api/properties/${propertyId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`"${propertyName}" removido com sucesso.`)
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? 'Erro ao remover imóvel')
        setConfirm(false)
      }
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Tem certeza?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Removendo...' : 'Sim, remover'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancelar</Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
      onClick={handleDelete}
    >
      <Trash2 className="w-4 h-4 mr-1" />Remover
    </Button>
  )
}
