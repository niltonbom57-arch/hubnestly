'use client'

import { useState } from 'react'
import { StepProperty } from '@/components/booking/step-property'
import { StepAddOns } from '@/components/booking/step-addons'
import { StepSchedule } from '@/components/booking/step-schedule'
import { StepPayment } from '@/components/booking/step-payment'
import { CheckCircle2 } from 'lucide-react'

type Step = 1 | 2 | 3 | 4

export interface BookingDraft {
  propertyId: string
  propertyNickname: string
  price: number       // total com add-ons
  basePrice: number   // só o imóvel
  duration: number    // total com add-ons
  baseDuration: number
  addOnIds: string[]
  addOnTotal: number
  scheduledAt: string
  teamId?: string
}

const STEPS = [
  { n: 1, label: 'Imóvel' },
  { n: 2, label: 'Extras' },
  { n: 3, label: 'Data e hora' },
  { n: 4, label: 'Pagamento' },
]

export default function NewBookingPage() {
  const [step, setStep] = useState<Step>(1)
  const [draft, setDraft] = useState<Partial<BookingDraft>>({})

  function goToStep2(data: Pick<BookingDraft, 'propertyId' | 'propertyNickname' | 'basePrice' | 'baseDuration'>) {
    setDraft((prev) => ({ ...prev, ...data }))
    setStep(2)
  }

  function goToStep3(data: { addOnIds: string[]; addOnTotal: number; addOnDuration: number }) {
    setDraft((prev) => ({
      ...prev,
      addOnIds: data.addOnIds,
      addOnTotal: data.addOnTotal,
      price: (prev.basePrice ?? 0) + data.addOnTotal,
      duration: (prev.baseDuration ?? 0) + data.addOnDuration,
    }))
    setStep(3)
  }

  function goToStep4(data: Pick<BookingDraft, 'scheduledAt' | 'teamId'>) {
    setDraft((prev) => ({ ...prev, ...data }))
    setStep(4)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center mb-10">
        {STEPS.map(({ n, label }, i) => (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step > n
                  ? 'bg-teal-600 text-white'
                  : step === n
                  ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${
                step >= n ? 'text-teal-700' : 'text-slate-400'
              }`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded-full transition-colors ${
                step > n ? 'bg-teal-500' : 'bg-slate-100'
              }`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <StepProperty
          onNext={(data) => goToStep2({
            propertyId: data.propertyId,
            propertyNickname: data.propertyNickname,
            basePrice: data.basePrice,
            baseDuration: data.baseDuration,
          })}
        />
      )}

      {step === 2 && (
        <StepAddOns
          basePrice={draft.basePrice ?? 0}
          baseDuration={draft.baseDuration ?? 0}
          onNext={goToStep3}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && draft.duration != null && (
        <StepSchedule
          duration={draft.duration}
          onNext={goToStep4}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && draft.propertyId && draft.scheduledAt && (
        <StepPayment
          draft={draft as BookingDraft}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  )
}
