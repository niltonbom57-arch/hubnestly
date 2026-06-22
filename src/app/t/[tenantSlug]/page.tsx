import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import { Button } from '@/components/ui/button'
import {
  Star, CheckCircle2, Phone, Mail, MapPin, Clock,
  Calendar, Shield, ArrowRight, Sparkles, Globe,
} from 'lucide-react'
import { AdminReturnBanner } from '@/components/admin/AdminReturnBanner'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

interface Props {
  params: { tenantSlug: string }
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

export async function generateMetadata({ params }: Props) {
  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant) return {}
  return {
    title: `${tenant.name} — Agende sua limpeza`,
    description: `Agende limpeza residencial com ${tenant.name}. Preço transparente, pagamento online.`,
  }
}

export default async function TenantPublicPage({ params }: Props) {
  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant) notFound()

  // Suspende acesso se tenant inativo
  if (tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') notFound()

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.id },
  })

  const addOns = await prisma.addOn.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  const bookingCount = await prisma.booking.count({
    where: { tenantId: tenant.id, status: { in: ['CONFIRMED', 'COMPLETED'] } },
  })

  const cities = settings?.cities ?? []
  const workDays = settings?.workDays ?? [1,2,3,4,5,6]
  const primaryColor = settings?.primaryColor ?? '#0d9488'
  const bookingUrl = `/t/${params.tenantSlug}/book`
  const registerUrl = `/auth/register/cliente?tenant=${params.tenantSlug}`

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo / nome da empresa */}
          <div className="flex items-center gap-2.5">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={tenant.name} className="h-8 w-auto object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">{tenant.name}</span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-500 font-medium">
            <a href="#servicos" className="hover:text-slate-900 transition-colors">Services</a>
            <a href="#precos" className="hover:text-slate-900 transition-colors">Pricing</a>
            {cities.length > 0 && (
              <a href="#cidades" className="hover:text-slate-900 transition-colors">Areas</a>
            )}
            <a href="#contato" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="light" compact />
            <Button variant="ghost" size="sm" className="text-slate-600 text-sm" asChild>
              <Link href={`/auth/login?tenant=${params.tenantSlug}`}>Sign in</Link>
            </Button>
            <Button
              size="sm"
              className="rounded-full px-5 text-white font-bold shadow-sm"
              style={{ backgroundColor: primaryColor }}
              asChild
            >
              <Link href={bookingUrl}>
                Agendar agora <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section
        className="relative py-20 px-4 text-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, white 60%)` }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: primaryColor }} />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-5" style={{ backgroundColor: primaryColor }} />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Badge de agendamentos */}
          {bookingCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 shadow-sm mb-6">
              <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              {bookingCount}+ limpezas realizadas
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Sua casa sempre <span style={{ color: primaryColor }}>impecável</span>
          </h1>

          {settings?.companySlogan ? (
            <p className="text-xl text-slate-500 mb-8 leading-relaxed">{settings.companySlogan}</p>
          ) : (
            <p className="text-xl text-slate-500 mb-8 leading-relaxed">
              Book your cleaning in minutes. Transparent pricing, secure payment, professional team.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="rounded-xl px-8 h-13 text-white font-bold text-base shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
              asChild
            >
              <Link href={bookingUrl}>
                <Calendar className="w-5 h-5 mr-2" /> Get instant quote
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl px-8 h-13 font-semibold" asChild>
              <Link href={registerUrl}>Create my account</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" /> Secure payment</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No contracts</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-green-500" /> Book in 3 minutes</span>
          </div>
        </div>
      </section>

      {/* ── SERVIÇOS ────────────────────────────────────────── */}
      <section id="servicos" className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Nossos serviços</h2>
          <p className="text-slate-500 text-center mb-10">Limpeza completa e personalizada para a sua residência</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🏠', title: 'Limpeza residencial', desc: 'Limpeza completa da sua casa, do chão ao teto.' },
              { icon: '✨', title: 'Limpeza profunda', desc: 'Limpeza detalhada em todos os cantos do imóvel.' },
              { icon: '🔄', title: 'Limpeza recorrente', desc: 'Semanal, quinzenal ou mensal com desconto especial.' },
              { icon: '🛋️', title: 'Pós-mudança', desc: 'Limpeza completa após mudança de residência.' },
              { icon: '🏢', title: 'Limpeza de escritório', desc: 'Ambiente de trabalho sempre limpo e organizado.' },
              { icon: '🪟', title: 'Limpeza de vidros', desc: 'Janelas e superfícies de vidro impecáveis.' },
            ].map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                <span className="text-3xl block mb-3">{s.icon}</span>
                <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Add-ons se existirem */}
          {addOns.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Serviços extras disponíveis</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {addOns.map(a => (
                  <div key={a.id} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-slate-700 shadow-sm">
                    <span>{a.icon ?? '✦'}</span>
                    <span>{a.name}</span>
                    <span className="font-bold" style={{ color: primaryColor }}>+${Number(a.price).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────── */}
      <section id="precos" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Como funciona</h2>
          <p className="text-slate-500 text-center mb-12">Simples, rápido e transparente</p>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', icon: <Calendar className="w-6 h-6" />, title: 'Escolha a data', desc: 'Veja os horários disponíveis em tempo real e reserve o que preferir.' },
              { step: '2', icon: <Shield className="w-6 h-6" />, title: 'Pague com segurança', desc: 'Pagamento 100% seguro via cartão. Sem surpresas no preço.' },
              { step: '3', icon: <CheckCircle2 className="w-6 h-6" />, title: 'Receba a equipe', desc: 'Nossa equipe chega no horário marcado e cuida de tudo.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  {s.icon}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: primaryColor }}>Passo {s.step}</div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CIDADES ATENDIDAS ───────────────────────────────── */}
      {cities.length > 0 && (
        <section id="cidades" className="py-16 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Cidades atendidas</h2>
            <p className="text-slate-500 mb-8">Atendemos as seguintes regiões</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {cities.map((city) => (
                <span key={city} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} /> {city}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HORÁRIOS ────────────────────────────────────────── */}
      {settings && (
        <section className="py-12 px-4">
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
            <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Horário de atendimento</h3>
            <p className="text-slate-500 text-sm mb-4">
              {workDays.map(d => DAY_NAMES[d]).join(', ')}
            </p>
            <p className="text-2xl font-black" style={{ color: primaryColor }}>
              {formatHour(settings.startHour)} – {formatHour(settings.endHour)}
            </p>
            <p className="text-xs text-slate-400 mt-2">Horário de {settings.timezone?.replace('America/', '') ?? 'Eastern Time'}</p>
          </div>
        </section>
      )}

      {/* ── CTA PRINCIPAL ───────────────────────────────────── */}
      <section
        className="py-20 px-4 text-center"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}
      >
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 text-yellow-300 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Pronto para ter uma casa sempre limpa?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Agende agora mesmo e receba uma equipe profissional na sua casa.
          </p>
          <Button
            size="lg"
            className="bg-white hover:bg-slate-50 font-bold text-base rounded-xl px-10 h-13 shadow-lg"
            style={{ color: primaryColor }}
            asChild
          >
            <Link href={bookingUrl}>
              <Calendar className="w-5 h-5 mr-2" /> Agendar minha limpeza
            </Link>
          </Button>
        </div>
      </section>

      {/* ── CONTATO / FOOTER ────────────────────────────────── */}
      <footer id="contato" className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
          {/* Empresa */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-extrabold text-lg">{tenant.name}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {settings?.companySlogan ?? 'Limpeza residencial profissional com preço transparente.'}
            </p>
          </div>

          {/* Contato */}
          <div>
            <p className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-3">Contato</p>
            <ul className="space-y-2 text-sm text-slate-400">
              {settings?.supportEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  <a href={`mailto:${settings.supportEmail}`} className="hover:text-white transition-colors">{settings.supportEmail}</a>
                </li>
              )}
              {settings?.supportPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  <a href={`tel:${settings.supportPhone}`} className="hover:text-white transition-colors">{settings.supportPhone}</a>
                </li>
              )}
              {settings?.whatsappNumber && (
                <li className="flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" className="hover:text-white transition-colors">
                    WhatsApp
                  </a>
                </li>
              )}
              {settings?.companyCity && (
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  <span>{settings.companyCity}{settings.companyState ? `, ${settings.companyState}` : ''}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Links */}
          <div>
            <p className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-3">Acesso</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={bookingUrl} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" /> Agendar limpeza
                </Link>
              </li>
              <li>
                <Link href={registerUrl} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" /> Criar conta
                </Link>
              </li>
              <li>
                <Link href={`/auth/login?tenant=${params.tenantSlug}`} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" /> Entrar na conta
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.</p>
          <p>
            Powered by{' '}
            <Link href="/" className="text-teal-500 hover:underline font-semibold">HubNestly</Link>
          </p>
        </div>
      </footer>

      {/* ── Banner flutuante para o admin ───────────────────── */}
      <AdminReturnBanner tenantSlug={params.tenantSlug} />
    </div>
  )
}
