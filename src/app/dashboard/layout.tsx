import Link from 'next/link'
import { auth } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calendar, Home, LogOut, Plus, Globe } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { HubNestlyLogo as GleamLogo } from '@/components/ui/HubNestlyLogo'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const initials = session.user.name
    ? session.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 shadow-sm">
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-slate-100">
          <Link href="/">
            <GleamLogo size="sm" variant="dark" />
          </Link>
        </div>

        {/* New booking CTA */}
        <div className="p-4">
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 font-semibold shadow-sm"
            asChild
          >
            <Link href="/dashboard/bookings/new">
              <Plus className="w-4 h-4 mr-2" /> Novo agendamento
            </Link>
          </Button>
        </div>

        {/* Voltar para home — destaque */}
        <div className="px-3 pb-2">
          <Link
            href="/"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-500 hover:text-teal-700 text-sm font-semibold transition-colors"
          >
            <Globe className="w-4 h-4" /> Página inicial
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Menu</p>
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Painel" />
          <NavItem href="/dashboard/bookings/new" icon={<Calendar className="w-4 h-4" />} label="Agendamentos" />
          <NavItem href="/dashboard/properties" icon={<Home className="w-4 h-4" />} label="Meus imóveis" />
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{session.user.name ?? 'Usuário'}</p>
              <p className="text-[11px] text-slate-400 truncate">{session.user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg h-9 text-sm"
            asChild
          >
            <Link href="/api/auth/signout">
              <LogOut className="w-3.5 h-3.5" /> Sair da conta
            </Link>
          </Button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="h-12 bg-white border-b border-slate-100 flex items-center justify-end px-6 shrink-0">
          <LanguageSwitcher variant="light" />
        </div>
        <div className="max-w-5xl mx-auto p-6 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl h-10 font-medium"
      asChild
    >
      <Link href={href}>{icon}{label}</Link>
    </Button>
  )
}
