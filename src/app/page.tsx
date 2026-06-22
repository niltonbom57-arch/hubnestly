import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PriceCalculator } from '@/components/marketing/price-calculator'
import { NavBar } from '@/components/marketing/NavBar'
import { HubNestlyLogo as GleamLogo } from '@/components/ui/HubNestlyLogo'
import { getTranslations } from '@/lib/i18n/server'
import {
  CheckCircle2, Calendar, CreditCard, Star, Shield, Clock,
  MapPin, ChevronRight, Sparkles, ArrowRight, Zap, Heart,
  Users, BadgeCheck, PhoneCall, Leaf,
} from 'lucide-react'

export default function HomePage() {
  const t = getTranslations()

  const STATS = [
    { value: '500+', label: t('landing.stats.cleanings') },
    { value: '4.9★', label: t('landing.stats.rating') },
    { value: '98%',  label: t('landing.stats.satisfied') },
    { value: '<3min', label: t('landing.stats.toBook') },
  ]

  const TESTIMONIALS = [
    { name: 'Maria Santos',  city: 'Miami, FL',   role: t('landing.testimonials.role1'), text: t('landing.testimonials.text1'), rating: 5, color: 'bg-rose-100 text-rose-700' },
    { name: 'John Davis',    city: 'Austin, TX',  role: t('landing.testimonials.role2'), text: t('landing.testimonials.text2'), rating: 5, color: 'bg-blue-100 text-blue-700' },
    { name: 'Ana Rodriguez', city: 'Chicago, IL', role: t('landing.testimonials.role3'), text: t('landing.testimonials.text3'), rating: 5, color: 'bg-purple-100 text-purple-700' },
  ]

  const FAQS = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
    { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
  ]

  const TRUST = [
    { icon: <BadgeCheck className="w-3.5 h-3.5" />, text: t('landing.hero.trust1') },
    { icon: <Shield className="w-3.5 h-3.5" />,     text: t('landing.hero.trust2') },
    { icon: <Zap className="w-3.5 h-3.5" />,        text: t('landing.hero.trust3') },
    { icon: <Heart className="w-3.5 h-3.5" />,      text: t('landing.hero.trust4') },
  ]

  const STEPS = [
    { num: '01', icon: <CheckCircle2 className="w-6 h-6 text-white" />, title: t('landing.howItWorks.step1Title'), desc: t('landing.howItWorks.step1Desc'), color: 'bg-[#1A6335]' },
    { num: '02', icon: <Calendar    className="w-6 h-6 text-white" />, title: t('landing.howItWorks.step2Title'), desc: t('landing.howItWorks.step2Desc'), color: 'bg-[#C04068]' },
    { num: '03', icon: <CreditCard  className="w-6 h-6 text-white" />, title: t('landing.howItWorks.step3Title'), desc: t('landing.howItWorks.step3Desc'), color: 'bg-slate-700' },
  ]

  const BENEFITS = [
    { icon: <Zap       className="w-4 h-4" />, title: t('landing.benefits.feat1Title'), desc: t('landing.benefits.feat1Desc') },
    { icon: <Clock     className="w-4 h-4" />, title: t('landing.benefits.feat2Title'), desc: t('landing.benefits.feat2Desc') },
    { icon: <Users     className="w-4 h-4" />, title: t('landing.benefits.feat3Title'), desc: t('landing.benefits.feat3Desc') },
    { icon: <PhoneCall className="w-4 h-4" />, title: t('landing.benefits.feat4Title'), desc: t('landing.benefits.feat4Desc') },
  ]

  const CALC_FEATS = [
    t('landing.calculator.feat1'),
    t('landing.calculator.feat2'),
    t('landing.calculator.feat3'),
    t('landing.calculator.feat4'),
  ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <NavBar />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="gradient-hero pt-16 pb-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-green-100 rounded-full opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] border border-green-100 rounded-full opacity-60" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-[#1A6335] rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Leaf className="w-3.5 h-3.5" />
            {t('landing.hero.badge')}
            <span className="bg-[#1A6335] text-white text-xs rounded-full px-2 py-0.5 font-semibold">{t('landing.hero.badgeNew')}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight text-balance mb-6">
            {t('landing.hero.title')}<br />
            <span className="shine-text">{t('landing.hero.titleHighlight')}</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10"
            dangerouslySetInnerHTML={{ __html: t('landing.hero.subtitle') }}
          />

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="text-white rounded-full h-14 px-8 text-base font-semibold shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1A6335, #267A45)' }}
              asChild
            >
              <Link href="/auth/register">
                {t('landing.hero.cta')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base text-slate-700 border-slate-200 hover:bg-slate-50" asChild>
              <a href="#precos">{t('landing.hero.ctaSecondary')}</a>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {TRUST.map((item) => (
              <span key={item.text} className="inline-flex items-center gap-1.5 bg-white border border-slate-100 shadow-sm rounded-full px-3 py-1.5 text-xs text-slate-600 font-medium">
                <span className="text-[#1A6335]">{item.icon}</span>{item.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────── */}
      <section className="bg-slate-900 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-slate-700">
          {STATS.map((s) => (
            <div key={s.label} className="text-center sm:px-8">
              <p className="text-3xl font-black text-[#4ACA6A] mb-1">{s.value}</p>
              <p className="text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#1A6335] font-semibold text-sm uppercase tracking-widest mb-3">{t('landing.howItWorks.sectionLabel')}</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {t('landing.howItWorks.title')}<br />
            <span className="text-[#D03258]">{t('landing.howItWorks.titleHighlight')}</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-14 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />
          {STEPS.map((step) => (
            <div key={step.num} className="relative flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-slate-100 shadow-sm card-hover">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 h-0.5 w-16 bg-gradient-to-r from-[#267A45] to-[#D03258] rounded-full" />
              <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mb-5 shadow-lg`}>
                {step.icon}
              </div>
              <span className="absolute top-4 right-4 text-5xl font-black text-slate-50 leading-none select-none">{step.num}</span>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFÍCIOS ─────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#1A6335] font-semibold text-sm uppercase tracking-widest mb-3">{t('landing.benefits.sectionLabel')}</p>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-6 text-balance">
                {t('landing.benefits.title')}<br />
                <span className="text-[#D03258]">{t('landing.benefits.titleHighlight')}</span>
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">{t('landing.benefits.subtitle')}</p>
              <div className="space-y-4">
                {BENEFITS.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-green-100 text-[#1A6335] flex items-center justify-center shrink-0 mt-0.5">
                      {f.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{f.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual booking card */}
            <div className="relative">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-50 rounded-bl-full" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-[#1A6335] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">HubNestly</p>
                      <p className="text-xs text-slate-500">{t('landing.benefits.bookingConfirm')}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="bg-green-100 text-[#1A6335] text-xs font-semibold px-2.5 py-1 rounded-full">{t('landing.benefits.confirmed')}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: t('landing.benefits.home'),     value: 'Casa — Miami, FL' },
                      { label: t('landing.benefits.date'),     value: 'Fri, Jun 20 · 9:00 AM ET' },
                      { label: t('landing.benefits.duration'), value: '3h 20min' },
                      { label: t('landing.benefits.team'),     value: 'Team Green ●' },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between items-center py-3 border-b border-slate-50">
                        <span className="text-sm text-slate-500">{r.label}</span>
                        <span className="text-sm font-semibold text-slate-900">{r.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold text-slate-900">{t('landing.benefits.totalPaid')}</span>
                      <span className="text-2xl font-black text-[#1A6335]">$220.00</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-50 text-center text-xs text-slate-400">
                    {t('landing.benefits.securePayment')}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-amber-400 text-slate-900 text-sm font-bold px-4 py-2 rounded-2xl shadow-lg">
                {t('landing.benefits.ratingBadge')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALCULADORA ──────────────────────────────────────── */}
      <section id="precos" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-[#1A6335] font-semibold text-sm uppercase tracking-widest mb-3">{t('landing.calculator.sectionLabel')}</p>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                {t('landing.calculator.title')}<br />
                <span className="text-[#D03258]">{t('landing.calculator.titleHighlight')}</span>
              </h2>
              <p className="text-slate-500 text-lg mb-6 leading-relaxed">{t('landing.calculator.subtitle')}</p>
              <div className="space-y-3">
                {CALC_FEATS.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-[#1A6335]" />
                    </div>
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <PriceCalculator />
              <p className="text-center text-xs text-slate-400 mt-3">{t('landing.calculator.disclaimer')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ─────────────────────────────────────── */}
      <section id="depoimentos" className="py-24 px-4 sm:px-6 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#4ACA6A] font-semibold text-sm uppercase tracking-widest mb-3">{t('landing.testimonials.sectionLabel')}</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              {t('landing.testimonials.title')}<br />
              <span className="text-[#F08098]">{t('landing.testimonials.titleHighlight')}</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item) => (
              <div key={item.name} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-7 flex flex-col gap-5 card-hover">
                <div className="flex gap-1">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-200 leading-relaxed flex-1">&ldquo;{item.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center font-bold text-sm shrink-0`}>
                    {item.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{item.name}</p>
                    <p className="text-slate-400 text-xs">{item.role} · {item.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[#1A6335] font-semibold text-sm uppercase tracking-widest mb-3">{t('landing.faq.sectionLabel')}</p>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{t('landing.faq.title')}</h2>
        </div>
        <div className="space-y-4">
          {FAQS.map((f, i) => (
            <details key={i} className="group border border-slate-200 rounded-xl overflow-hidden">
              <summary className="flex justify-between items-center px-6 py-4 cursor-pointer font-semibold text-slate-800 hover:bg-slate-50 transition-colors list-none">
                {f.q}
                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0 ml-3" />
              </summary>
              <div className="px-6 pb-4 text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-4">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── PARA EMPRESAS ───────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <p className="text-[#4ACA6A] font-bold text-xs uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
              <span className="w-6 h-px bg-[#4ACA6A]/40" />
              {t('landing.forBusinesses.sectionLabel')}
              <span className="w-6 h-px bg-[#4ACA6A]/40" />
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              {t('landing.forBusinesses.title')}{' '}
              <span className="bg-gradient-to-r from-[#4ACA6A] to-[#F08098] bg-clip-text text-transparent">
                {t('landing.forBusinesses.titleHighlight')}
              </span>{' '}
              {t('landing.forBusinesses.titleEnd')}
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
              {t('landing.forBusinesses.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-6 hover:border-green-500/30 transition-colors">
              <div className="text-3xl mb-4">🌐</div>
              <h3 className="text-white font-extrabold mb-2">{t('landing.forBusinesses.card1Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t('landing.forBusinesses.card1Desc')}</p>
            </div>
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-6 hover:border-rose-500/30 transition-colors">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-white font-extrabold mb-2">{t('landing.forBusinesses.card2Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t('landing.forBusinesses.card2Desc')}</p>
            </div>
            <div className="bg-slate-800 border border-amber-500/20 rounded-2xl p-6 hover:border-amber-500/40 transition-colors relative">
              <div className="absolute -top-3 right-5">
                <span className="bg-amber-400 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full">{t('landing.forBusinesses.card3Badge')}</span>
              </div>
              <div className="text-3xl mb-4">📵</div>
              <h3 className="text-white font-extrabold mb-2">{t('landing.forBusinesses.card3Title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('landing.forBusinesses.card3Desc')}{' '}
                <span className="font-mono text-amber-400 text-xs">hubnestly.com/t/yourcompany</span>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600/20 to-rose-600/20 border border-green-500/20 rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <p className="text-white font-extrabold text-lg">{t('landing.forBusinesses.resultTitle')}</p>
              <p className="text-[#4ACA6A] text-sm mt-1">{t('landing.forBusinesses.resultDesc')}</p>
            </div>
            <Link href="/para-empresas" className="shrink-0">
              <Button className="bg-[#1A6335] hover:bg-[#267A45] text-white rounded-xl font-bold px-6 h-11 whitespace-nowrap">
                {t('landing.forBusinesses.cta')} <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hubnestly opacity-5 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-6">
            <Sparkles className="w-7 h-7 text-[#1A6335]" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 text-balance">
            {t('landing.cta.title')}<br />
            <span className="text-[#D03258]">{t('landing.cta.titleHighlight')}</span>
          </h2>
          <p className="text-slate-500 text-lg mb-8 max-w-xl mx-auto">{t('landing.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="text-white rounded-full h-14 px-10 text-base font-semibold shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1A6335, #267A45)' }}
              asChild
            >
              <Link href="/auth/register">
                {t('landing.cta.button')} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-slate-700 border-slate-200" asChild>
              <a href="#como-funciona">{t('landing.cta.secondary')}</a>
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-4">{t('landing.cta.disclaimer')}</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <GleamLogo size="md" variant="dark" />
              <p className="text-slate-500 text-sm mt-3 max-w-xs leading-relaxed">{t('landing.footer.tagline')}</p>
              <div className="flex items-center gap-2 mt-4">
                <MapPin className="w-4 h-4 text-[#1A6335]" />
                <span className="text-sm text-slate-500">{t('landing.footer.coverage')}</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-3">{t('nav.product')}</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#como-funciona" className="hover:text-[#1A6335] transition-colors">{t('nav.howItWorks')}</a></li>
                <li><a href="#precos" className="hover:text-[#1A6335] transition-colors">{t('landing.calculator.title')}</a></li>
                <li><a href="#depoimentos" className="hover:text-[#1A6335] transition-colors">{t('nav.testimonials')}</a></li>
                <li><a href="#faq" className="hover:text-[#1A6335] transition-colors">{t('nav.faq')}</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-3">{t('nav.account')}</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/auth/login" className="hover:text-[#1A6335] transition-colors">{t('nav.login')}</Link></li>
                <li><Link href="/auth/register" className="hover:text-[#1A6335] transition-colors">{t('nav.createAccount')}</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#1A6335] transition-colors">{t('nav.dashboard')}</Link></li>
                <li><Link href="/para-empresas" className="hover:text-[#1A6335] transition-colors">{t('nav.forBusinesses')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} HubNestly Inc. {t('landing.footer.copyright')}</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#1A6335] transition-colors">{t('nav.privacy')}</a>
              <a href="#" className="hover:text-[#1A6335] transition-colors">{t('nav.terms')}</a>
              <a href="#" className="hover:text-[#1A6335] transition-colors">{t('nav.contact')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
