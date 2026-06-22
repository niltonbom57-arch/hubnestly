/**
 * Server-side i18n helpers — use inside Server Components and Route Handlers.
 * For Client Components, use `useI18n()` from context.tsx instead.
 */
import { cookies } from 'next/headers'
import pt from './translations/pt.json'
import en from './translations/en.json'
import es from './translations/es.json'

export type Locale = 'pt' | 'en' | 'es'

const TRANSLATIONS = { pt, en, es } as const
export const COOKIE_KEY = 'gleam_locale'
export const DEFAULT_LOCALE: Locale = 'pt'

function resolve(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as object)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  return typeof current === 'string' ? current : key
}

/** Read locale from request cookies (server-side). */
export function getLocale(): Locale {
  try {
    const cookieStore = cookies()
    const saved = cookieStore.get(COOKIE_KEY)?.value as Locale
    return saved && saved in TRANSLATIONS ? saved : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

/** Returns a `t()` translate function scoped to the given (or auto-detected) locale. */
export function getTranslations(locale?: Locale) {
  const l = locale ?? getLocale()
  const dict = TRANSLATIONS[l] as Record<string, unknown>
  return function t(key: string, vars?: Record<string, string | number>): string {
    let text = resolve(dict, key)
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
    }
    return text
  }
}
