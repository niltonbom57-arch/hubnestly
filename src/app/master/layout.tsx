import { auth } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HubNestlyLogo } from '@/components/ui/HubNestlyLogo'
import {
  Globe, Building2, Users, DollarSign,
  Calendar, LogOut, ShieldCheck, LayoutDashboard
} from 'lucide-react'

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect('/auth/login')
  if (!session.user.isPlatformAdmin) redirect('/dashboard')

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-[#060C08] text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <HubNestlyLogo size="sm" variant="white" />
          <div className="flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-3 h-3 text-[#4ACA6A]" />
            <p className="text-xs text-[#4ACA6A] font-semibold">Master Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <p className="text-xs text-white/30 uppercase tracking-widest px-3 py-2 font-semibold">Plataforma</p>
          <NavItem href="/master"           icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <NavItem href="/master/companies" icon={<Building2 className="w-4 h-4" />}      label="Empresas" />
          <NavItem href="/master/users"     icon={<Users className="w-4 h-4" />}           label="Usuários" />
          <NavItem href="/master/bookings"  icon={<Calendar className="w-4 h-4" />}        label="Agendamentos" />
          <NavItem href="/master/revenue"   icon={<DollarSign className="w-4 h-4" />}      label="Receita Global" />
          <div className="pt-4">
            <p className="text-xs text-white/30 uppercase tracking-widest px-3 py-2 font-semibold">Acesso rápido</p>
          </div>
          <NavItem href="/" icon={<Globe className="w-4 h-4" />} label="Ver site" />
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A6335] to-[#D03258] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {session.user.name?.charAt(0).toUpperCase() ?? 'M'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
              <p className="text-xs text-white/40 truncate">{session.user.email}</p>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-950/30 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1A6335]" />
            <span className="text-sm font-semibold text-slate-700">HubNestly Platform Control</span>
          </div>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
            ● Produção
          </span>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
    >
      {icon}{label}
    </Link>
  )
}
