'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import pt from './translations/pt.json'
import en from './translations/en.json'
import es from './translations/es.json'

export type Locale = 'pt' | 'en' | 'es'

const TRANSLATIONS = { pt, en, es } as const

const COOKIE_KEY = 'gleam_locale'
const DEFAULT_LOCALE: Locale = 'pt'

// ── Tipo de acesso aninhado por ponto ──────────────────────────────────────
type NestedKeys<T> = T extends object
  ? { [K in keyof T]: K extends string ? `${K}` | `${K}.${NestedKeys<T[K]>}` : never }[keyof T]
  : never

export type TranslationKey = NestedKeys<typeof pt>

// ── Resolve chave aninhada (ex: "common.save") ────────────────────────────
function resolve(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as object)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return key // fallback: retorna a própria chave
    }
  }
  return typeof current === 'string' ? current : key
}

// ── Context ───────────────────────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────
export function I18nProvider({ children, initialLocale }: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE)

  // Lê o cookie ao montar (client-side)
  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`))
    if (match?.[1]) {
      const saved = decodeURIComponent(match[1]) as Locale
      if (saved in TRANSLATIONS) setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    // Persiste no cookie por 1 ano
    document.cookie = `${COOKIE_KEY}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    // Atualiza atributo lang do HTML
    document.documentElement.lang = next === 'pt' ? 'pt-BR' : next
  }, [])

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>): string => {
    const translations = TRANSLATIONS[locale] as Record<string, unknown>
    let text = resolve(translations, key)
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
    }
    return text
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
