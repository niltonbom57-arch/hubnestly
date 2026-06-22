'use client'

import { useI18n, type Locale } from '@/lib/i18n/context'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

const LANGUAGES: { code: Locale; label: string; flag: string; short: string }[] = [
  { code: 'pt', label: 'Português', flag: '🇧🇷', short: 'PT' },
  { code: 'en', label: 'English',   flag: '🇺🇸', short: 'EN' },
  { code: 'es', label: 'Español',   flag: '🇪🇸', short: 'ES' },
]

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark'
  compact?: boolean
}

export function LanguageSwitcher({ variant = 'light', compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isDark = variant === 'dark'

  function handleChange(code: Locale) {
    if (code === locale) return
    setLocale(code)                    // updates cookie + client state
    startTransition(() => {
      router.refresh()                 // re-renders Server Components with new cookie
    })
  }

  return (
    <div
      className={`flex items-center gap-0.5 rounded-xl p-1 transition-opacity ${
        isPending ? 'opacity-60 pointer-events-none' : ''
      } ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}
    >
      {LANGUAGES.map((lang) => {
        const isActive = lang.code === locale
        return (
          <button
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            title={lang.label}
            aria-pressed={isActive}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
              isActive
                ? isDark
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'bg-white text-[#1A6335] shadow-sm ring-1 ring-slate-200'
                : isDark
                  ? 'text-white/50 hover:text-white/80 hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
            }`}
          >
            <span className="text-sm leading-none" aria-hidden="true">{lang.flag}</span>
            {!compact && <span>{lang.short}</span>}
          </button>
        )
      })}
    </div>
  )
}
