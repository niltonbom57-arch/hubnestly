'use client'

import Link from 'next/link'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useI18n } from '@/lib/i18n/context'
import { Home, Building2, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { HubNestlyLogo as GleamLogo } from '@/components/ui/HubNestlyLogo'

export default function RegisterChoicePage() {
  const { locale } = useI18n()

  const content = {
    pt: {
      title: 'Criar conta',
      subtitle: 'Escolha o tipo de conta que deseja criar',
      client: {
        badge: 'Quero agendar limpezas',
        title: 'Sou cliente',
        desc: 'Quero agendar limpezas para minha residência, ver preços e pagar online.',
        perks: [
          'Agendamento em menos de 3 minutos',
          'Preço calculado na hora',
          'Pagamento seguro via Stripe',
          'Histórico de limpezas',
        ],
        cta: 'Criar conta de cliente',
      },
      business: {
        badge: 'Tenho empresa de limpeza',
        title: 'Sou empresa',
        desc: 'Quero gerenciar minha empresa de limpeza, meus clientes e agendamentos.',
        perks: [
          '14 dias grátis, sem cartão',
          'Painel completo de gestão',
          'Clientes e equipes organizados',
          'Pagamentos automatizados',
        ],
        cta: 'Criar conta empresarial',
      },
      login: 'Já tem conta?',
      loginLink: 'Fazer login',
      back: 'Voltar ao início',
    },
    en: {
      title: 'Create account',
      subtitle: 'Choose the type of account you want to create',
      client: {
        badge: 'I want to book cleanings',
        title: "I'm a customer",
        desc: 'I want to schedule home cleanings, see prices and pay online.',
        perks: [
          'Book in under 3 minutes',
          'Instant price calculation',
          'Secure payment via Stripe',
          'Cleaning history',
        ],
        cta: 'Create customer account',
      },
      business: {
        badge: 'I run a cleaning company',
        title: "I'm a business",
        desc: 'I want to manage my cleaning company, customers and bookings.',
        perks: [
          '14-day free trial, no card needed',
          'Full management dashboard',
          'Organized customers & teams',
          'Automated payments',
        ],
        cta: 'Create business account',
      },
      login: 'Already have an account?',
      loginLink: 'Log in',
      back: 'Back to home',
    },
    es: {
      title: 'Crear cuenta',
      subtitle: 'Elige el tipo de cuenta que deseas crear',
      client: {
        badge: 'Quiero reservar limpiezas',
        title: 'Soy cliente',
        desc: 'Quiero agendar limpiezas para mi hogar, ver precios y pagar online.',
        perks: [
          'Reserva en menos de 3 minutos',
          'Precio calculado al instante',
          'Pago seguro via Stripe',
          'Historial de limpiezas',
        ],
        cta: 'Crear cuenta de cliente',
      },
      business: {
        badge: 'Tengo empresa de limpieza',
        title: 'Soy empresa',
        desc: 'Quiero gestionar mi empresa de limpieza, clientes y reservas.',
        perks: [
          '14 días gratis, sin tarjeta',
          'Panel completo de gestión',
          'Clientes y equipos organizados',
          'Pagos automatizados',
        ],
        cta: 'Crear cuenta empresarial',
      },
      login: '¿Ya tienes cuenta?',
      loginLink: 'Iniciar sesión',
      back: 'Volver al inicio',
    },
  }

  const t = content[locale] ?? content.pt

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col">

      {/* Top bar */}
      <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center justify-between px-6">
        <Link href="/">
          <GleamLogo size="md" variant="dark" />
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher variant="light" />
          <Link href="/" className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors">
            <Home className="w-3.5 h-3.5" /> {t.back}
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">{t.title}</h1>
          <p className="text-slate-500 text-lg">{t.subtitle}</p>
        </div>

        {/* Cards de escolha */}
        <div className="grid sm:grid-cols-2 gap-5 w-full max-w-2xl">

          {/* Cliente */}
          <Link href="/auth/register/cliente" className="group">
            <div className="h-full bg-white rounded-2xl border-2 border-slate-200 hover:border-teal-400 hover:shadow-xl hover:shadow-teal-100 transition-all duration-200 p-7 flex flex-col cursor-pointer">
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full mb-5 w-fit">
                <User className="w-3 h-3" /> {t.client.badge}
              </span>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform">
                <User className="w-7 h-7 text-white" />
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 mb-2">{t.client.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{t.client.desc}</p>

              {/* Perks */}
              <ul className="space-y-2 mb-7 flex-1">
                {t.client.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex items-center justify-between bg-teal-600 group-hover:bg-teal-700 text-white font-bold text-sm rounded-xl px-4 py-3 transition-colors">
                {t.client.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Empresa */}
          <Link href="/onboarding" className="group">
            <div className="h-full bg-white rounded-2xl border-2 border-slate-200 hover:border-violet-400 hover:shadow-xl hover:shadow-violet-100 transition-all duration-200 p-7 flex flex-col cursor-pointer">
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-3 py-1 rounded-full mb-5 w-fit">
                <Building2 className="w-3 h-3" /> {t.business.badge}
              </span>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7 text-white" />
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 mb-2">{t.business.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{t.business.desc}</p>

              {/* Perks */}
              <ul className="space-y-2 mb-7 flex-1">
                {t.business.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex items-center justify-between bg-violet-600 group-hover:bg-violet-700 text-white font-bold text-sm rounded-xl px-4 py-3 transition-colors">
                {t.business.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Login link */}
        <p className="mt-8 text-sm text-slate-500">
          {t.login}{' '}
          <Link href="/auth/login" className="text-teal-600 hover:underline font-semibold">
            {t.loginLink}
          </Link>
        </p>
      </main>
    </div>
  )
}
