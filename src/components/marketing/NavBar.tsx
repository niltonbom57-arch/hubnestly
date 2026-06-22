'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useI18n } from '@/lib/i18n/context'
import { HubNestlyLogo as GleamLogo } from '@/components/ui/HubNestlyLogo'
import { ChevronRight } from 'lucide-react'

export function NavBar() {
  const { t } = useI18n()

  return (
    <nav className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/">
          <GleamLogo size="md" variant="dark" />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#como-funciona" className="hover:text-slate-900 transition-colors">{t('nav.howItWorks')}</a>
          <a href="#precos" className="hover:text-slate-900 transition-colors">{t('nav.pricing')}</a>
          <a href="#depoimentos" className="hover:text-slate-900 transition-colors">{t('nav.testimonials')}</a>
          <a href="#faq" className="hover:text-slate-900 transition-colors">{t('nav.faq')}</a>
          <Link
            href="/para-empresas"
            className="font-semibold transition-colors px-3 py-1 rounded-full text-[#D03258] border border-[#D03258]/30 bg-[#D03258]/5 hover:bg-[#D03258]/10"
          >
            {t('nav.forBusinesses')} ✦
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="light" />
          <Button variant="ghost" size="sm" className="text-slate-600" asChild>
            <Link href="/auth/login">{t('common.login')}</Link>
          </Button>
          <Button
            size="sm"
            className="text-white rounded-full px-5 font-bold shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1A6335, #267A45)' }}
            asChild
          >
            <Link href="/auth/register">
              {t('nav.scheduleNow')} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
