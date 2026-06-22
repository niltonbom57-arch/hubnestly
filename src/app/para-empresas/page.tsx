import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HubNestlyLogo as GleamLogo } from '@/components/ui/HubNestlyLogo'
import { WaitlistCTA } from '@/components/marketing/WaitlistCTA'
import { PlanCTA } from '@/components/marketing/PlanCTA'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import {
  ArrowRight, CheckCircle2, Star, BarChart3, Users,
  Smartphone, Globe, Shield, Sparkles, ChevronRight,
  Calendar, CreditCard, Bell, Settings, TrendingUp, Heart,
  MessageSquare, Package, BadgeCheck, Lock,
} from 'lucide-react'

export const metadata = {
  title: 'Para Empresas de Limpeza — HubNestly',
  description:
    'O HubNestly organiza os agendamentos da sua empresa de limpeza, automatiza os recebimentos e transmite confiança para os seus clientes. Comece grátis hoje.',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
      {children}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-teal-500 font-bold text-xs uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
      <span className="w-6 h-px bg-teal-500/40" />
      {children}
      <span className="w-6 h-px bg-teal-500/40" />
    </p>
  )
}

// ─── Dados ────────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    number: '01',
    icon: <Calendar className="w-7 h-7" />,
    color: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50',
    accent: 'text-teal-600',
    title: 'Organização total dos agendamentos',
    desc: 'Chega de conflito de horário, de anotação em papel e de equipes sem saber onde ir. No HubNestly, cada agendamento tem data, hora e equipe definidos automaticamente — e você vê tudo em um calendário visual, do celular ou computador.',
    items: [
      'Calendário inteligente por equipe',
      '40 min de deslocamento bloqueados automaticamente entre limpezas',
      'Nenhum horário se sobrepõe',
      'Gerencie de qualquer lugar, qualquer dispositivo',
    ],
  },
  {
    number: '02',
    icon: <CreditCard className="w-7 h-7" />,
    color: 'from-violet-500 to-blue-500',
    bg: 'bg-violet-50',
    accent: 'text-violet-600',
    title: 'Recebimentos simples e garantidos',
    desc: 'O cliente paga online no momento do agendamento — cartão de crédito ou débito, processado pelo Stripe. Sem negociação, sem esquecimento, sem calote. O dinheiro cai direto na sua conta. Você trabalha, você recebe.',
    items: [
      'Pagamento antes de confirmar o serviço',
      'Cartão de crédito e débito aceitos',
      'Transferência automática para sua conta bancária',
      'Histórico completo de receitas com relatórios mensais',
    ],
  },
  {
    number: '03',
    icon: <Users className="w-7 h-7" />,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    accent: 'text-amber-600',
    title: 'Mais clientes, carteira mais ampla',
    desc: 'Seu link de agendamento funciona 24 horas por dia, 7 dias por semana. Cole no Instagram, no WhatsApp, no Google Meu Negócio — e os clientes agendam sozinhos, mesmo quando você está dormindo. Além disso, use o email marketing integrado para reativar quem parou de agendar.',
    items: [
      'Link de agendamento único para divulgar em qualquer canal',
      'Clientes agendam sem precisar te chamar',
      'Email marketing para campanhas e promoções',
      'Histórico de clientes para acompanhar o crescimento',
    ],
  },
  {
    number: '04',
    icon: <Shield className="w-7 h-7" />,
    color: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50',
    accent: 'text-rose-600',
    title: 'Confiança que transforma cliente em fã',
    desc: 'Quando o cliente acessa seu link e vê um sistema profissional — com preço calculado na hora, opções claras, pagamento seguro e confirmação automática — ele sente que está contratando uma empresa séria. Isso diferencia você de qualquer concorrente que ainda usa WhatsApp.',
    items: [
      'Painel do cliente com histórico de limpezas',
      'Preço transparente calculado em tempo real',
      'Confirmação automática por email após o pagamento',
      'Sua logo, suas cores, seu nome — identidade profissional',
    ],
  },
]

const PAIN_BEFORE_AFTER = [
  {
    before: 'Cliente manda mensagem no WhatsApp às 23h pedindo orçamento',
    after: 'Cliente acessa seu link, vê o preço na hora e agenda sozinho',
  },
  {
    before: 'Você esquece de confirmar, cliente não aparece',
    after: 'Confirmação automática por email e cliente pagou antes',
  },
  {
    before: 'Duas equipes marcadas no mesmo horário no mesmo bairro',
    after: 'Calendário bloqueia automaticamente, zero conflito',
  },
  {
    before: 'Cliente "esqueceu" de pagar, você fica sem receber',
    after: 'Pagamento feito na hora do agendamento — garantido',
  },
  {
    before: 'Não sabe quantos clientes têm ou quanto faturou esse mês',
    after: 'Painel com receita, agendamentos e carteira de clientes',
  },
  {
    before: 'Concorrente passa na frente com um sistema mais profissional',
    after: 'Você aparece com painel próprio, logo e link personalizado',
  },
]

const FEATURES_GRID = [
  { icon: <Globe className="w-5 h-5" />,       color: 'bg-teal-100 text-teal-700',   title: 'Link de agendamento próprio',     desc: 'Um endereço único da sua empresa para compartilhar em qualquer canal digital.' },
  { icon: <CreditCard className="w-5 h-5" />,  color: 'bg-violet-100 text-violet-700', title: 'Pagamento online garantido',      desc: 'Stripe integrado. O cliente paga antes de confirmar. Sem inadimplência.' },
  { icon: <Calendar className="w-5 h-5" />,    color: 'bg-blue-100 text-blue-700',   title: 'Calendário por equipe',           desc: 'Gerencie várias equipes com bloqueio automático de deslocamento.' },
  { icon: <BarChart3 className="w-5 h-5" />,   color: 'bg-emerald-100 text-emerald-700', title: 'Relatórios e receita',         desc: 'Receita do mês, projeções e histórico completo de faturamento.' },
  { icon: <Bell className="w-5 h-5" />,        color: 'bg-amber-100 text-amber-700', title: 'Alertas a cada novo pedido',      desc: 'Email e SMS na hora que um cliente confirmar o agendamento.' },
  { icon: <MessageSquare className="w-5 h-5" />, color: 'bg-rose-100 text-rose-700', title: 'Email marketing integrado',       desc: 'Envie promoções para sua base de clientes sem ferramenta extra.' },
  { icon: <BadgeCheck className="w-5 h-5" />,  color: 'bg-slate-100 text-slate-700', title: 'Identidade da sua marca',         desc: 'Logo, cores, slogan e nome da empresa — sistema no seu nome.' },
  { icon: <Package className="w-5 h-5" />,     color: 'bg-cyan-100 text-cyan-700',   title: 'Serviços extras (add-ons)',       desc: 'Aumente o ticket médio com limpeza de forno, piscina, janelas e mais.' },
  { icon: <Smartphone className="w-5 h-5" />,  color: 'bg-orange-100 text-orange-700', title: '100% no celular',              desc: 'Gerencie tudo pelo celular. Painel do admin responsivo e rápido.' },
]

const TESTIMONIALS = [
  {
    name: 'Claudia Ferreira',
    company: 'Brilho Total Cleaning',
    city: 'Naples, FL',
    before: 'Perdia 3 horas por dia respondendo WhatsApp e organizando agendamentos no papel.',
    after: 'Hoje recebo novos clientes enquanto estou trabalhando. O sistema resolve sozinho.',
    avatar: 'C',
    color: 'bg-teal-500',
    result: '+40% clientes em 60 dias',
  },
  {
    name: 'Roberto Lima',
    company: 'Clean & Shine Services',
    city: 'Fort Myers, FL',
    before: 'Minhas equipes chegavam ao mesmo endereço no mesmo horário pelo menos uma vez por semana.',
    after: 'Zero conflito de agenda desde que comecei a usar. O calendário cuida disso automaticamente.',
    avatar: 'R',
    color: 'bg-blue-500',
    result: 'Zero conflitos de agenda',
  },
  {
    name: 'Patricia Souza',
    company: 'PS Home Cleaning',
    city: 'Bonita Springs, FL',
    before: 'Tinha clientes que combinavam, eu ia lá, e eles não pagavam na hora. Ficava no prejuízo.',
    after: 'Com o pagamento antes de confirmar, esse problema acabou completamente. Faturamento previsível.',
    avatar: 'P',
    color: 'bg-violet-500',
    result: '100% dos serviços pagos',
  },
]

const STEPS = [
  {
    n: '1',
    icon: '✍️',
    color: 'bg-teal-600',
    title: 'Crie sua conta em 3 minutos',
    desc: 'Preencha o nome da sua empresa, as cidades que você atende e crie seu login de admin. Sem burocracia, sem cartão de crédito.',
  },
  {
    n: '2',
    icon: '⚙️',
    color: 'bg-violet-600',
    title: 'Configure do jeito que você trabalha',
    desc: 'Defina seus preços por tipo de cômodo, cadastre suas equipes e coloque a logo da empresa. O sistema se adapta a você.',
  },
  {
    n: '3',
    icon: '📲',
    color: 'bg-amber-600',
    title: 'Compartilhe seu link e pronto',
    desc: 'Cole o link no seu Instagram, WhatsApp, Google Meu Negócio. Seus clientes agendam, pagam e recebem confirmação — tudo automático.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    fee: '8%',
    feeLabel: 'por limpeza',
    example: 'Ex: limpeza de $150 → você paga $12',
    desc: 'Ideal para quem está começando a organizar a empresa',
    clientLimit: 'Até 30 pagantes/mês',
    clientRange: '0–30',
    highlight: false,
    features: [
      'Até 30 clientes pagantes por mês',
      'Link de agendamento próprio',
      'Até 2 equipes',
      'Pagamento online (Stripe)',
      'Calendário com bloqueio automático',
      'Painel do cliente',
      'Alertas por email',
    ],
  },
  {
    name: 'Pro',
    fee: '5%',
    feeLabel: 'por limpeza',
    example: 'Ex: limpeza de $150 → você paga $7,50',
    desc: 'Para quem já tem movimento e quer crescer mais',
    clientLimit: '31 a 150 pagantes/mês',
    clientRange: '31–150',
    highlight: true,
    badge: 'Mais escolhido',
    features: [
      'De 31 a 150 clientes pagantes por mês',
      'Tudo do Starter',
      'Equipes ilimitadas',
      'Email marketing integrado',
      'Alertas SMS',
      'Serviços adicionais (add-ons)',
      'Relatórios avançados de receita',
      'Domínio personalizado',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Scale',
    fee: '3%',
    feeLabel: 'por limpeza',
    example: 'Ex: limpeza de $150 → você paga $4,50',
    desc: 'Para operações grandes, em múltiplas cidades',
    clientLimit: 'Acima de 150 pagantes/mês',
    clientRange: '150+',
    highlight: false,
    features: [
      'Acima de 150 clientes pagantes por mês',
      'Tudo do Pro',
      'Multi-localização',
      'Integração via API',
      'Gerente de conta dedicado',
      'Onboarding personalizado',
      'SLA de disponibilidade',
    ],
  },
]

const FAQS = [
  {
    q: 'Preciso entender de tecnologia para usar?',
    a: 'Não. Se você sabe usar o WhatsApp, você consegue usar o HubNestly. O setup guia você passo a passo e o suporte em português está sempre disponível.',
  },
  {
    q: 'Meus clientes precisam criar uma conta?',
    a: 'Sim, mas é rápido — nome, email e senha. Depois disso eles têm um painel onde veem o histórico de limpezas, podem reagendar e cancelar. A maioria acha muito prático.',
  },
  {
    q: 'Como funciona o recebimento do dinheiro?',
    a: 'Através do Stripe, um dos sistemas de pagamento mais seguros do mundo. O dinheiro fica disponível na sua conta bancária em 2 dias úteis após cada limpeza.',
  },
  {
    q: 'Posso usar meu próprio domínio (meusite.com)?',
    a: 'Sim, no plano Pro e Scale. Seus clientes acessam pela URL da sua própria marca.',
  },
  {
    q: 'Quanto custa usar o HubNestly?',
    a: 'Zero mensalidade. Cobramos apenas um percentual por limpeza paga: 8% com até 30 clientes pagantes no mês, 5% entre 31 e 150, e 3% acima de 150. O percentual é ajustado automaticamente todo mês com base no volume real — sem você precisar trocar de plano.',
  },
  {
    q: 'O que acontece ao fim dos 14 dias de teste?',
    a: 'Você escolhe um plano e continua. Se não quiser continuar, sua conta fica pausada — não apagamos nada.',
  },
  {
    q: 'Como aviso meus clientes atuais sobre o novo sistema?',
    a: 'Uma mensagem simples no WhatsApp já resolve: "Agora você pode agendar direto pelo link: hubnestly.com/t/suaempresa". A maioria adota rápido.',
  },
]

// ─── Componentes reutilizáveis ─────────────────────────────────────────────────

function PillarCard({ pillar, reverse }: { pillar: typeof PILLARS[number]; reverse?: boolean }) {
  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
      {/* Texto */}
      <div className={reverse ? 'lg:order-2' : ''}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 bg-gradient-to-br ${pillar.color} rounded-xl flex items-center justify-center text-white shadow-md`}>
            {pillar.icon}
          </div>
          <span className={`text-xs font-black tracking-widest ${pillar.accent} uppercase`}>
            Pilar {pillar.number}
          </span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
          {pillar.title}
        </h3>
        <p className="text-slate-500 leading-relaxed mb-6">{pillar.desc}</p>
        <ul className="space-y-2.5">
          {pillar.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
              <CheckCircle2 className={`w-4 h-4 ${pillar.accent} shrink-0 mt-0.5`} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Card visual */}
      <div className={`${pillar.bg} rounded-3xl p-8 ${reverse ? 'lg:order-1' : ''}`}>
        <div className={`w-16 h-16 bg-gradient-to-br ${pillar.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-6`}>
          {pillar.icon}
        </div>
        <p className={`text-4xl font-black ${pillar.accent} mb-2`}>Pilar {pillar.number}</p>
        <p className="text-slate-700 font-bold text-lg leading-tight">{pillar.title}</p>
        <div className="mt-6 space-y-2">
          {pillar.items.map((item) => (
            <div key={item} className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 text-sm text-slate-700">
              <Sparkles className={`w-3.5 h-3.5 ${pillar.accent} shrink-0`} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan }: { plan: typeof PLANS[number] }) {
  return (
    <div className={`relative rounded-2xl p-8 flex flex-col ${
      plan.highlight
        ? 'bg-gradient-to-b from-teal-600 to-cyan-700 text-white shadow-2xl shadow-teal-500/30 ring-4 ring-teal-300/30 scale-105'
        : 'bg-white border border-slate-100 shadow-sm'
    }`}>
      {'badge' in plan && plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-amber-400 text-amber-900 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm">
            {plan.badge}
          </span>
        </div>
      )}
      <div className="mb-6">
        <p className={`text-xs font-extrabold uppercase tracking-widest mb-3 ${plan.highlight ? 'text-teal-200' : 'text-slate-400'}`}>
          {plan.name}
        </p>
        {/* Fee em destaque */}
        <div className="flex items-end gap-1.5 mb-1">
          <span className={`text-5xl font-black leading-none ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
            {plan.fee}
          </span>
          <span className={`text-sm mb-1.5 font-semibold ${plan.highlight ? 'text-teal-200' : 'text-slate-500'}`}>
            {plan.feeLabel}
          </span>
        </div>
        <p className={`text-xs mt-2 mb-4 ${plan.highlight ? 'text-teal-200/80' : 'text-slate-400'}`}>
          {plan.example}
        </p>
        {/* Limite de clientes */}
        <div className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold mb-3 ${
          plan.highlight ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'
        }`}>
          <Users className="w-3.5 h-3.5" />
          {plan.clientLimit}
        </div>
        <p className={`text-sm ${plan.highlight ? 'text-teal-100' : 'text-slate-500'}`}>{plan.desc}</p>
      </div>
      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-teal-200' : 'text-teal-500'}`} />
            <span className={plan.highlight ? 'text-teal-50' : 'text-slate-600'}>{f}</span>
          </li>
        ))}
      </ul>
      <PlanCTA planName={plan.name} highlight={plan.highlight} />
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ParaEmpresasPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── BOTÃO HOME FIXO (mobile) ─────────────────────────────────── */}
      <Link
        href="/"
        className="fixed bottom-5 left-5 z-50 md:hidden inline-flex items-center gap-1.5 bg-white border border-slate-200 shadow-lg rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-teal-700 hover:border-teal-300 transition-colors"
      >
        <ArrowRight className="w-4 h-4 rotate-180" /> Página inicial
      </Link>

      {/* ── WAITLIST BANNER TOPO ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 py-2.5 px-5 text-center">
        <p className="text-amber-900 text-sm font-semibold flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>🚀 Plataforma em fase de lançamento — vagas limitadas para os primeiros parceiros</span>
          <WaitlistCTA variant="banner" label="Garantir minha vaga" />
        </p>
      </div>

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav className="bg-slate-900 sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <GleamLogo size="md" variant="white" />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link href="/" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Página inicial
            </Link>
            <span className="w-px h-4 bg-slate-700" />
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#recursos"      className="hover:text-white transition-colors">Recursos</a>
            <a href="#depoimentos"   className="hover:text-white transition-colors">Cases</a>
            <a href="#planos"        className="hover:text-white transition-colors">Planos</a>
            <a href="#faq"           className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher variant="dark" />
            <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1 sm:hidden">
              ← Início
            </Link>
            <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
              Já tenho conta
            </Link>
            <Link href="/onboarding">
              <Button size="sm" className="bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-bold px-5">
                Começar grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="bg-slate-900 relative overflow-hidden">
        {/* Blobs decorativos */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-5 pt-20 pb-28 relative text-center">
          {/* Badge topo */}
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-semibold px-5 py-2 rounded-full mb-10">
            <Sparkles className="w-4 h-4" />
            Feito para empresas de limpeza residencial
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-7 tracking-tight">
            Sua empresa de limpeza<br />
            <GradientText>organizada, paga e confiável</GradientText>
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-4">
            O HubNestly é a plataforma que ajuda empresas de limpeza a{' '}
            <strong className="text-white">organizar os agendamentos</strong>,{' '}
            <strong className="text-white">garantir os recebimentos</strong>,{' '}
            <strong className="text-white">ampliar a carteira de clientes</strong>{' '}
            e transmitir a <strong className="text-white">confiança</strong> que o cliente precisa para contratar.
          </p>
          <p className="text-slate-400 text-base mb-10">
            Tudo isso em um único sistema. Do agendamento ao pagamento — sem WhatsApp, sem caderno, sem estresse.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <WaitlistCTA variant="hero" label="Garantir minha vaga grátis" />
            <a href="#como-funciona">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-semibold h-14 text-base">
                Ver como funciona
              </Button>
            </a>
          </div>

          {/* Mini credenciais */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-400">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" />14 dias grátis</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" />Sem cartão de crédito</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" />Setup em 3 minutos</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" />Suporte em português</span>
          </div>

          {/* Tem ou não tem site — não importa */}
          <div className="mt-10 grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left">
              <span className="text-2xl shrink-0">🌐</span>
              <div>
                <p className="text-white font-bold text-sm">Já tem site ou Instagram?</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  O HubNestly funciona como um complemento — você coloca o link de agendamento onde quiser e seus clientes chegam prontos para pagar.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left">
              <span className="text-2xl shrink-0">📵</span>
              <div>
                <p className="text-white font-bold text-sm">Não tem site nenhum?</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Sem problema. O HubNestly já é o seu site. Seu link <span className="text-teal-400 font-mono">hubnestly.com/t/suaempresa</span> faz tudo — agendamento, pagamento e comunicação com o cliente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ANTES × DEPOIS ───────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>A realidade que você conhece</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Antes do HubNestly vs. <GradientText>depois do HubNestly</GradientText>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Cabeçalhos */}
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3 text-center">
              <p className="text-red-600 font-extrabold text-sm">😓 Antes — do jeito difícil</p>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-3 text-center">
              <p className="text-teal-700 font-extrabold text-sm">✅ Depois — com o HubNestly</p>
            </div>

            {/* Pares */}
            {PAIN_BEFORE_AFTER.map((pair, i) => (
              <React.Fragment key={i}>
                <div className="bg-white border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-red-400 text-lg shrink-0">✗</span>
                  <p className="text-slate-600 text-sm leading-relaxed">{pair.before}</p>
                </div>
                <div className="bg-white border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm leading-relaxed font-medium">{pair.after}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEM SITE OU NÃO TEM — NÃO IMPORTA ───────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Para qualquer empresa</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Tem site ou não tem —{' '}
              <GradientText>o HubNestly funciona do mesmo jeito</GradientText>
            </h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed">
              A plataforma foi criada para se encaixar na realidade da sua empresa, seja ela grande ou pequena, digital ou ainda no papel.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Cenário 1 */}
            <div className="bg-gradient-to-b from-teal-50 to-white border border-teal-100 rounded-2xl p-7">
              <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center text-2xl mb-5">
                🌐
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-3">
                Já tenho site próprio
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Perfeito. Cole o botão de agendamento no seu site existente. Os visitantes clicam, agendam e pagam — sem sair da experiência da sua marca.
              </p>
              <ul className="space-y-2">
                {[
                  'Link que você incorpora onde quiser',
                  'Complementa sem substituir',
                  'Domínio personalizado disponível (plano Pro)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cenário 2 */}
            <div className="bg-gradient-to-b from-violet-50 to-white border border-violet-100 rounded-2xl p-7">
              <div className="w-12 h-12 bg-violet-100 text-violet-700 rounded-2xl flex items-center justify-center text-2xl mb-5">
                📱
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-3">
                Só tenho Instagram ou WhatsApp
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Ótimo. Cole o link na bio do Instagram, mande no status do WhatsApp e compartilhe nos stories. Seus seguidores viram clientes pagantes em segundos.
              </p>
              <ul className="space-y-2">
                {[
                  'Link perfeito para bio do Instagram',
                  'Funciona no WhatsApp Business',
                  'Compartilhe em grupos e stories',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cenário 3 */}
            <div className="bg-gradient-to-b from-amber-50 to-white border border-amber-100 rounded-2xl p-7 relative">
              <div className="absolute -top-3 right-5">
                <span className="bg-amber-400 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full">
                  Mais comum
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-2xl mb-5">
                📵
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-3">
                Não tenho nada ainda
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                O HubNestly já é tudo que você precisa. Seu endereço <span className="font-mono text-amber-700 font-bold">hubnestly.com/t/suaempresa</span> vira sua presença digital completa — agendamento, pagamento e gestão em um só lugar.
              </p>
              <ul className="space-y-2">
                {[
                  'Seu "site" pronto em 3 minutos',
                  'Sem precisar contratar ninguém',
                  'Começa a receber clientes no mesmo dia',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Destaque central */}
          <div className="mt-8 bg-slate-900 rounded-2xl px-8 py-6 text-center">
            <p className="text-white font-extrabold text-lg mb-1">
              Em todos os casos, o resultado é o mesmo:
            </p>
            <p className="text-teal-300 text-base font-medium">
              clientes agendam sozinhos · pagam na hora · você gerencia tudo em um painel
            </p>
          </div>
        </div>
      </section>

      {/* ── 4 PILARES ────────────────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <SectionLabel>Os 4 pilares do HubNestly</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Tudo que sua empresa precisa para <GradientText>crescer com confiança</GradientText>
            </h2>
          </div>

          <div className="space-y-20">
            {PILLARS.map((pillar, i) => (
              <PillarCard key={pillar.number} pillar={pillar} reverse={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-5 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Simples assim</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Do cadastro ao <GradientText>primeiro cliente em minutos</GradientText>
            </h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              Não precisa de técnico, não precisa de treinamento. Se você usa smartphone, você usa o HubNestly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-12px)] w-[calc(100%-24px)] h-0.5 bg-gradient-to-r from-white/20 to-transparent z-10" />
                )}
                <div className="bg-slate-800 border border-white/5 rounded-2xl p-7 h-full hover:border-teal-500/30 transition-colors">
                  <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg`}>
                    {s.icon}
                  </div>
                  <p className="text-xs text-slate-500 font-black tracking-widest uppercase mb-2">Passo {s.n}</p>
                  <h3 className="text-white font-extrabold text-lg mb-3">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <WaitlistCTA variant="hero" label="Quero começar — garantir minha vaga" />
          </div>
        </div>
      </section>

      {/* ── MOCK PAINEL ──────────────────────────────────────────────── */}
      <section id="recursos" className="py-24 px-5 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Seu painel de controle</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Tudo na palma da mão — <GradientText>do celular ao computador</GradientText>
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Uma visão clara de tudo que acontece na sua empresa, em tempo real.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Features list */}
            <div className="space-y-4">
              {[
                { icon: <Calendar className="w-5 h-5" />, color: 'bg-teal-100 text-teal-700', title: 'Calendário visual por equipe', desc: 'Veja todos os agendamentos do dia, da semana ou do mês. Clique em qualquer slot para ver os detalhes.' },
                { icon: <TrendingUp className="w-5 h-5" />, color: 'bg-violet-100 text-violet-700', title: 'Receita e projeção financeira', desc: 'Quanto entrou esse mês, quanto vai entrar mês que vem. Tome decisões com dados reais.' },
                { icon: <Users className="w-5 h-5" />, color: 'bg-amber-100 text-amber-700', title: 'Carteira de clientes completa', desc: 'Nome, email, quantas vezes agendou, quanto gastou, quando foi a última limpeza.' },
                { icon: <Bell className="w-5 h-5" />, color: 'bg-rose-100 text-rose-700', title: 'Notificações em tempo real', desc: 'Cada novo agendamento confirmado aparece no painel e você recebe email + SMS na hora.' },
                { icon: <Settings className="w-5 h-5" />, color: 'bg-slate-100 text-slate-700', title: 'Configurações da sua empresa', desc: 'Logo, cores, preços, cidades, equipes, credenciais de pagamento. Tudo no seu controle.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center shrink-0`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm mb-1">{item.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mock dashboard */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 shadow-2xl sticky top-24">
              {/* Browser bar */}
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="flex-1 bg-slate-800 rounded-md h-5 ml-2 flex items-center px-3">
                  <Lock className="w-2.5 h-2.5 text-slate-500 mr-1.5" />
                  <span className="text-slate-500 text-[10px]">hubnestly.com/t/<span className="text-teal-400">suaempresa</span>/admin</span>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Este mês', value: '$4.180', up: true },
                  { label: 'Agendamentos', value: '31' },
                  { label: 'Clientes', value: '22' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-slate-800 rounded-xl p-3 text-center">
                    <p className="text-teal-400 font-black text-lg leading-none">{kpi.value}</p>
                    <p className="text-slate-500 text-[10px] mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Agenda do dia */}
              <div className="bg-slate-800 rounded-xl p-3 mb-2">
                <p className="text-slate-400 text-[11px] font-semibold mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Hoje — Sexta, 20 Jun
                </p>
                {[
                  { time: '08:00', client: 'Maria Santos', addr: 'Naples', team: 'Equipe A', status: 'Em andamento', dot: 'bg-purple-400' },
                  { time: '11:30', client: 'John Davis',   addr: 'Fort Myers', team: 'Equipe B', status: 'Confirmado',   dot: 'bg-teal-400' },
                  { time: '14:00', client: 'Ana Lima',     addr: 'Bonita Spr.', team: 'Equipe A', status: 'Confirmado',  dot: 'bg-teal-400' },
                  { time: '16:30', client: 'Peter Walsh',  addr: 'Cape Coral', team: 'Equipe B', status: 'Confirmado',   dot: 'bg-teal-400' },
                ].map((b) => (
                  <div key={b.time} className="flex items-center gap-2 py-1.5 border-b border-slate-700/60 last:border-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${b.dot} shrink-0`} />
                    <span className="text-teal-400 font-mono text-[10px] w-9 shrink-0">{b.time}</span>
                    <span className="text-slate-200 text-[10px] flex-1 truncate">{b.client}</span>
                    <span className="text-slate-500 text-[9px] truncate hidden sm:block">{b.addr}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                      b.status === 'Em andamento' ? 'bg-purple-500/25 text-purple-300' : 'bg-teal-500/25 text-teal-300'
                    }`}>{b.status}</span>
                  </div>
                ))}
              </div>

              {/* Novo pedido — notification */}
              <div className="bg-teal-900/40 border border-teal-700/50 rounded-xl p-3 flex items-start gap-2">
                <Bell className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-teal-300 text-[10px] font-bold">Novo agendamento!</p>
                  <p className="text-slate-400 text-[9px]">Sarah Miller · Sáb 22 Jun · 09:00 · $195</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GRID DE RECURSOS ─────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Tudo incluso</SectionLabel>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Uma plataforma. <GradientText>Nenhuma ferramenta extra.</GradientText>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES_GRID.map((f) => (
              <div key={f.title} className="flex items-start gap-3 bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-colors">
                <div className={`w-9 h-9 ${f.color} rounded-xl flex items-center justify-center shrink-0`}>
                  {f.icon}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">{f.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS / CASES ──────────────────────────────────────── */}
      <section id="depoimentos" className="py-24 px-5 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Cases reais</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Empresas que usam o HubNestly<br />
              <GradientText>e não voltam para o WhatsApp</GradientText>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                {/* Resultado */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-center">
                  <p className="text-white font-extrabold text-sm">{t.result}</p>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs text-red-500 font-semibold uppercase tracking-wide mb-1">Antes</p>
                      <p className="text-slate-600 text-sm leading-relaxed">&ldquo;{t.before}&rdquo;</p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                      <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-1">Depois</p>
                      <p className="text-slate-700 text-sm leading-relaxed font-medium">&ldquo;{t.after}&rdquo;</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-50">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-slate-400 text-xs">{t.company} · {t.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ───────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <SectionLabel>Sem mensalidade. Sem surpresa.</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Você só paga quando <GradientText>você recebe</GradientText>
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto leading-relaxed">
              Cobramos um pequeno percentual por limpeza concluída. Sem mensalidade fixa, sem custo em meses parados. Quanto mais você trabalha, mais você ganha.
            </p>
          </div>

          {/* Destaque "sem mensalidade" */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl px-6 py-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <p className="text-teal-800 font-semibold text-sm">
                14 dias grátis para testar · Sem cartão · Sem mensalidade · Só paga por limpeza concluída
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => <PlanCard key={plan.name} plan={plan} />)}
          </div>

          {/* Ajuste automático */}
          <div className="mt-10 bg-slate-900 rounded-2xl p-7 border border-slate-700">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-teal-500/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-white font-extrabold text-lg mb-2">
                  O plano se ajusta sozinho todo mês — sem você precisar fazer nada
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  No final de cada mês, contamos quantos clientes efetuaram pagamento pela plataforma. Com base nesse número, o percentual aplicado é ajustado automaticamente para o plano correspondente. Você nunca paga a mais do que deveria.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { range: '0 a 30 pagantes', fee: '8%', plan: 'Starter', color: 'border-slate-600 text-slate-300' },
                    { range: '31 a 150 pagantes', fee: '5%', plan: 'Pro', color: 'border-teal-500/40 text-teal-300' },
                    { range: 'Acima de 150', fee: '3%', plan: 'Scale', color: 'border-slate-600 text-slate-300' },
                  ].map((tier) => (
                    <div key={tier.plan} className={`border rounded-xl px-4 py-3 ${tier.color}`}>
                      <p className="text-xs text-slate-500 font-semibold mb-1">{tier.range}</p>
                      <p className="font-black text-xl leading-none">{tier.fee} <span className="text-xs font-normal text-slate-500">({tier.plan})</span></p>
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-4 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  Apenas limpezas com pagamento confirmado contam para o cálculo mensal. Cancelamentos e agendamentos pendentes não entram.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-slate-400 text-sm mt-6">
            <Shield className="w-3.5 h-3.5 inline mr-1.5 text-teal-500" />
            Todos os planos incluem suporte em português, pagamentos via Stripe e atualizações gratuitas.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-5 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Ainda tem dúvidas?</SectionLabel>
            <h2 className="text-3xl font-extrabold text-slate-900">Perguntas frequentes</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`px-6 py-5 ${i < FAQS.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <p className="font-bold text-slate-800 mb-2 flex items-start gap-2.5">
                  <ChevronRight className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                  {f.q}
                </p>
                <p className="text-slate-500 text-sm leading-relaxed pl-6">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden border border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <p className="text-4xl mb-6">🧹✨</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
                Sua empresa merece ser<br />
                <GradientText>levada a sério pelos clientes</GradientText>
              </h2>
              <p className="text-slate-300 text-lg mb-4 max-w-xl mx-auto leading-relaxed">
                Quando o cliente acessa seu link e vê um sistema profissional — com preço claro, pagamento seguro e confirmação automática — ele confia. E cliente que confia, volta e indica.
              </p>
              <p className="text-slate-400 text-sm mb-10">
                Pare de perder clientes para concorrentes com sistema mais profissional. Comece hoje.
              </p>

              <WaitlistCTA variant="hero" label="Organizar minha empresa agora" />

              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-8 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />14 dias grátis</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />Sem cartão</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />Cancele quando quiser</span>
                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-400" />Suporte em português</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 py-12 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <GleamLogo size="md" variant="white" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <Link href="/"             className="hover:text-white transition-colors">Para clientes</Link>
            <a    href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a    href="#planos"        className="hover:text-white transition-colors">Planos</a>
            <Link href="/auth/login"   className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/onboarding"   className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
              Criar conta grátis →
            </Link>
          </div>
          <p className="text-slate-600 text-xs">© {new Date().getFullYear()} HubNestly</p>
        </div>
      </footer>
    </div>
  )
}
