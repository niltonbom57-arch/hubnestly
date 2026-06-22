'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WaitlistModal } from './WaitlistModal'
import { ArrowRight, Sparkles } from 'lucide-react'

interface WaitlistCTAProps {
  /** Variante visual do botão */
  variant?: 'hero' | 'banner' | 'outline'
  label?: string
}

export function WaitlistCTA({
  variant = 'hero',
  label = 'Quero entrar na lista de espera',
}: WaitlistCTAProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {variant === 'hero' && (
        <Button
          size="lg"
          onClick={() => setOpen(true)}
          className="bg-amber-400 hover:bg-amber-300 text-amber-900 rounded-xl font-extrabold px-8 h-14 text-base shadow-lg shadow-amber-400/30"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {label}
        </Button>
      )}

      {variant === 'banner' && (
        <Button
          onClick={() => setOpen(true)}
          className="bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-bold px-6 h-11 whitespace-nowrap shrink-0"
        >
          {label} <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      )}

      {variant === 'outline' && (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-white/20 text-white hover:bg-white/10 rounded-xl font-bold h-14 px-8 text-base"
        >
          {label}
        </Button>
      )}

      {open && <WaitlistModal onClose={() => setOpen(false)} />}
    </>
  )
}

/** Barra fixo no topo que aparece ao scrollar */
export function WaitlistStickyBar() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {open && <WaitlistModal onClose={() => setOpen(false)} />}
    </>
  )
}
