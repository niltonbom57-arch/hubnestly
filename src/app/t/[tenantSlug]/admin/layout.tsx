import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, Calendar, Users, DollarSign, LogOut,
  Users2, Settings, Globe, Sparkles,
} from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { SharePageButton } from '@/components/admin/SharePageButton'
import { GleamLogo } from '@/components/ui/GleamLogo'

interface Props {
  children: React.ReactNode
  params: { tenantSlug: string }
}

export default async function TenantAdminLayout({ children, params }: Props) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as { tenantId?: string; role?: string; name?: string; email?: string } | undefined

  if (!session) redirect('/auth/login')

  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant) notFound()

  // Apenas ADMIN do próprio tenant
  if (sessionUser?.tenantId !== tenant.id || sessionUser?.role !== 'ADMIN') {
    redirect('/')
  }

  const base = `/t/${params.tenantSlug}/admin`

  // Calcula status do trial
  const trialDaysLeft = tenant.trialEndsAt
    ? Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / 86400000)
    : null
  const isTrialExpired     = tenant.status === 'TRIAL' && trialDaysLeft !== null && trialDaysLeft < 0
  const isTrialExpiringSoon = tenant.status === 'TRIAL' && trialDaysLeft !== null && trialDaysLeft <= 3 && trialDaysLeft >= 0
  const isTrialActive       = tenant.status === 'TRIAL' && !isTrialExpired

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Banner de trial ──────────────────────────── */}
      {isTrialExpired && (
        <div className="bg-red-600 text-white text-sm font-semibold text-center py-2.5 px-4 flex items-center justify-center gap-2">
          ⚠️ Seu período de teste expirou. Entre em contato para continuar usando o HubNestly.
        </div>
      )}
      {isTrialExpiringSoon && (
        <div className="bg-orange-500 text-white text-sm font-semibold text-center py-2.5 px-4 flex items-center justify-center gap-2">
          ⏰ Seu trial expira em <strong>{trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''}</strong>. Fale conosco para continuar.
        </div>
      )}
      {isTrialActive && !isTrialExpiringSoon && (
        <div className="bg-teal-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          {trialDaysLeft !== null
            ? <>Trial gratuito — <strong>{trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}</strong></>
            : <>Trial gratuito — <strong>acesso ilimitado</strong></>
          }
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">

        {/* Logo + empresa */}
        <div className="p-5 border-b border-slate-700/60">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <GleamLogo size="sm" variant="white" />
          </Link>
          <div className="bg-slate-800 rounded-xl px-3 py-2.5">
            <p className="text-xs text-slate-400 font-medium">Empresa</p>
            <p className="text-white font-bold text-sm truncate">{tenant.name}</p>
            <p className="text-teal-400 font-mono text-[10px] mt-0.5 truncate">
              hubnestly.com/t/{tenant.slug}
            </p>
          </div>
        </div>

        {/* Voltar para home — destaque */}
        <div className="px-3 pt-3 pb-1">
          <Link
            href="/"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-teal-600/20 border border-slate-700 hover:border-teal-500/40 text-slate-400 hover:text-teal-300 text-sm font-semibold transition-colors"
          >
            <Globe className="w-4 h-4" /> Página inicial
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <NavItem href={base}                       icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <NavItem href={`${base}/calendar`}         icon={<Calendar className="w-4 h-4" />}       label="Calendário" />
          <NavItem href={`${base}/bookings`}         icon={<Calendar className="w-4 h-4" />}       label="Agendamentos" />
          <NavItem href={`${base}/customers`}        icon={<Users className="w-4 h-4" />}          label="Clientes" />
          <NavItem href={`${base}/revenue`}          icon={<DollarSign className="w-4 h-4" />}     label="Receita" />
          <NavItem href={`${base}/teams`}            icon={<Users2 className="w-4 h-4" />}         label="Equipes" />

          <div className="pt-4 pb-1">
            <p className="text-xs text-slate-500 uppercase tracking-widest px-3 font-semibold">Sistema</p>
          </div>
          <NavItem href={`${base}/settings`}         icon={<Settings className="w-4 h-4" />}       label="Configurações" />
          <NavItem href={`/t/${params.tenantSlug}`}  icon={<Globe className="w-4 h-4" />}          label="Página de agendamento" />
        </nav>

        {/* Plano atual */}
        <div className="mx-3 mb-3 bg-gradient-to-r from-teal-600 to-cyan-700 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <p className="text-teal-100 text-xs font-bold uppercase tracking-wide">Plano Starter</p>
          </div>
          <p className="text-white text-xs leading-relaxed">8% por limpeza · Até 30 clientes/mês</p>
          <Link href="/para-empresas#planos" className="text-teal-200 text-[11px] underline mt-1 block hover:text-white">
            Ver todos os planos →
          </Link>
        </div>

        {/* Usuário + Logout */}
        <div className="p-3 border-t border-slate-700/60">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {sessionUser?.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{sessionUser?.name}</p>
              <p className="text-xs text-slate-400 truncate">{sessionUser?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl"
            asChild
          >
            <Link href="/api/auth/signout">
              <LogOut className="w-4 h-4" /> Sair
            </Link>
          </Button>
        </div>
      </aside>

      {/* ── Conteúdo ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
          <p className="text-sm text-slate-400">
            Painel administrativo — <span className="text-slate-700 font-semibold">{tenant.name}</span>
          </p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="light" compact />
            <SharePageButton
              tenantSlug={params.tenantSlug}
              tenantName={tenant.name}
              variant="header"
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-8">{children}</div>
        </main>
      </div>
      </div>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl h-9 font-medium"
      asChild
    >
      <Link href={href}>{icon}{label}</Link>
    </Button>
  )
}
