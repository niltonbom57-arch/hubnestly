'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { LayoutDashboard, X } from 'lucide-react'
import { useState } from 'react'

interface AdminReturnBannerProps {
  tenantSlug: string
}

export function AdminReturnBanner({ tenantSlug }: AdminReturnBannerProps) {
  const { data: session, status } = useSession()
  const [dismissed, setDismissed] = useState(false)

  if (status === 'loading' || dismissed) return null

  const user = session?.user as { role?: string; tenantSlug?: string; isPlatformAdmin?: boolean } | undefined

  // Mostra apenas se for admin deste tenant OU platform admin
  const isAdmin = user?.isPlatformAdmin || (user?.role === 'ADMIN' && user?.tenantSlug === tenantSlug)
  if (!isAdmin) return null

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        {/* Ícone */}
        <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center shrink-0">
          <LayoutDashboard className="w-4 h-4 text-white" />
        </div>

        {/* Texto + link */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 leading-tight">Você está visualizando como cliente</p>
          <Link
            href={`/t/${tenantSlug}/admin`}
            className="text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors leading-tight"
          >
            Voltar ao painel admin →
          </Link>
        </div>

        {/* Fechar */}
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors shrink-0"
        >
          <X className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </div>
  )
}
