'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'

interface HomeButtonProps {
  position?: 'fixed' | 'absolute' | 'static'
  className?: string
}

/**
 * Botão discreto "Página inicial" para páginas que não têm sidebar.
 * Por padrão, fixed no canto superior esquerdo.
 */
export function HomeButton({ position = 'fixed', className = '' }: HomeButtonProps) {
  return (
    <Link
      href="/"
      className={`
        inline-flex items-center gap-1.5
        text-xs font-semibold text-slate-500
        hover:text-teal-600 transition-colors
        bg-white/80 hover:bg-white backdrop-blur
        border border-slate-200 rounded-full
        px-3 py-1.5 shadow-sm
        ${position === 'fixed' ? 'fixed top-4 left-4 z-50' : ''}
        ${position === 'absolute' ? 'absolute top-4 left-4 z-10' : ''}
        ${className}
      `}
    >
      <Home className="w-3.5 h-3.5" />
      Página inicial
    </Link>
  )
}
