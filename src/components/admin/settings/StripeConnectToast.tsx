'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function StripeConnectToast() {
  const params = useSearchParams()

  useEffect(() => {
    const connected = params.get('stripe_connected')
    const error     = params.get('stripe_error')

    if (connected) {
      toast.success('Conta Stripe conectada com sucesso! Você já pode receber pagamentos.')
    }
    if (error) {
      toast.error(`Erro ao conectar Stripe: ${decodeURIComponent(error)}`)
    }
  }, [params])

  return null
}
