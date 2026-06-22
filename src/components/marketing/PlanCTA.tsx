'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WaitlistModal } from './WaitlistModal'
import { ArrowRight } from 'lucide-react'

interface PlanCTAProps {
  planName: string
  highlight?: boolean
}

export function PlanCTA({ planName, highlight }: PlanCTAProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={() => setOpen(true)}
          className={`w-full rounded-xl font-bold h-11 ${
            highlight
              ? 'bg-white text-teal-700 hover:bg-teal-50'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          Quero o plano {planName} <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
        <p className={`text-center text-[11px] ${highlight ? 'text-teal-200' : 'text-slate-400'}`}>
          14 dias grátis · Sem cartão · Cancele quando quiser
        </p>
      </div>

      {open && <WaitlistModal onClose={() => setOpen(false)} />}
    </>
  )
}
