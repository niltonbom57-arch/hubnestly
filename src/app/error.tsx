'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-bold text-gray-800">Algo deu errado</h2>
      <p className="text-gray-500 text-sm max-w-sm">
        {error.message ?? 'Ocorreu um erro inesperado. Tente recarregar a página.'}
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono">ID: {error.digest}</p>
      )}
      <div className="flex gap-2">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Voltar ao início
        </Button>
      </div>
    </div>
  )
}
