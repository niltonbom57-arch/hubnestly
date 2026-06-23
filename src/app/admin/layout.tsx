import Link from 'next/link'
import { auth } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calendar, Users, DollarSign, LogOut, Users2, Settings, Send, Globe, ShieldCheck } from 'lucide-react'
import { NotificationBell } from '@/components/admin/notification-bell'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { HubNestlyLogo as GleamLogo } from '@/components/ui/HubNestlyLogo'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-slate-700/60">
          <Link href="/" className="flex items-center gap-2">
            <GleamLogo size="sm" variant="white" />
          </Link>
          <p className="text-xs text-slate-400 mt-1 ml-9">Painel Administrativo</p>
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
          <AdminNavItem href="/admin"           icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <AdminNavItem href="/admin/calendar"  icon={<Calendar className="w-4 h-4" />}        label="Calendário" />
          <AdminNavItem href="/admin/bookings"  icon={<Calendar className="w-4 h-4" />}        label="Agendamentos" />
          <AdminNavItem href="/admin/customers" icon={<Users className="w-4 h-4" />}           label="Clientes" />
          <AdminNavItem href="/admin/revenue"   icon={<DollarSign className="w-4 h-4" />}      label="Receita" />
          <AdminNavItem href="/admin/teams"     icon={<Users2 className="w-4 h-4" />}          label="Times" />
          <AdminNavItem href="/admin/marketing" icon={<Send className="w-4 h-4" />}            label="Email Marketing" />

          <div className="pt-4 pb-1">
            <p className="text-xs text-slate-500 uppercase tracking-widest px-3 font-semibold">Sistema</p>
          </div>
          <AdminNavItem href="/admin/settings" icon={<Settings className="w-4 h-4" />} label="Configurações" />
          <AdminNavItem href="/admin/tenants"  icon={<Globe className="w-4 h-4" />}    label="Empresas" />

          <div className="pt-4 pb-1">
            <p className="text-xs text-slate-500 uppercase tracking-widest px-3 font-semibold">Plataforma</p>
          </div>
          <AdminNavItem
            href="/admin/master"
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Master Dashboard"
            highlight
          />
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-slate-700/60">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {session.user.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
              <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
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

      {/* Main */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-end px-6 gap-3 shrink-0">
          <LanguageSwitcher variant="light" compact />
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

function AdminNavItem({ href, icon, label, highlight }: {
  href: string
  icon: React.ReactNode
  label: string
  highlight?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`w-full justify-start gap-3 rounded-xl h-9 font-medium ${
        highlight
          ? 'text-[#4ACA6A] hover:text-white hover:bg-gradient-to-r hover:from-[#1A6335]/40 hover:to-[#D03258]/20 border border-[#1A6335]/30'
          : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
      }`}
      asChild
    >
      <Link href={href}>{icon}{label}</Link>
    </Button>
  )
}
