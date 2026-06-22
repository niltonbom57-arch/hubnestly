'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@/lib/validation/schemas/auth'
import { Button } from '@/components/ui/button'
import { HubNestlyLogo as GleamLogo } from '@/components/ui/HubNestlyLogo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import {
  Eye, EyeOff, Loader2, ArrowLeft, AlertCircle,
  CheckCircle2, ClipboardCopy,
} from 'lucide-react'

// Mensagens de erro mapeadas pelo código retornado pelo NextAuth
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin:  'Email ou senha incorretos. Verifique e tente novamente.',
  USER_NOT_FOUND:     'Nenhuma conta encontrada com este email. Verifique ou cadastre-se.',
  INVALID_PASSWORD:   'Senha incorreta. Tente novamente ou use "Esqueci minha senha".',
  TENANT_NOT_FOUND:   'Empresa não encontrada. Verifique o link de acesso.',
  TENANT_INACTIVE:    'Esta empresa está inativa. Entre em contato com o suporte.',
  NO_PASSWORD:        'Esta conta usa login via Google. Clique em "Entrar com Google".',
  Default:            'Erro ao fazer login. Verifique seus dados e tente novamente.',
}

function getDemoAccounts() {
  return [
    { label: 'Admin', email: 'admin@cleanbookfl.com', password: 'admin123!' },
    { label: 'Cliente', email: 'ana@exemplo.com', password: 'cliente123!' },
  ]
}

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg]         = useState<string | null>(null)
  const [loginOk, setLoginOk]           = useState(false)

  const tenantSlug = searchParams.get('tenant') ?? 'cleanbookfl'
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    setErrorMsg(null)
    try {
      const result = await signIn('credentials', {
        email:      data.email.trim().toLowerCase(),
        password:   data.password,
        tenantSlug,
        redirect:   false,
        callbackUrl,
      })

      if (!result) {
        setErrorMsg(ERROR_MESSAGES['Default'] ?? 'Erro ao fazer login.')
        return
      }

      if (result.error) {
        // NextAuth passa o message do Error lançado no authorize()
        const code = result.error ?? 'Default'
        setErrorMsg(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default ?? 'Erro ao fazer login.')
        return
      }

      // Sucesso! Busca sessão para redirecionar conforme o perfil
      setLoginOk(true)
      toast.success('Login realizado! Redirecionando...')

      // Obtém sessão atualizada para saber role e tenantSlug
      const { getSession } = await import('next-auth/react')
      const session = await getSession()
      const user = session?.user as { role?: string; tenantSlug?: string; isPlatformAdmin?: boolean } | undefined

      if (user?.isPlatformAdmin) {
        // Dono da plataforma → painel global
        router.push('/admin')
      } else if (user?.role === 'ADMIN' && user?.tenantSlug) {
        // Admin de empresa → painel da empresa
        router.push(`/t/${user.tenantSlug}/admin`)
      } else {
        // Cliente → dashboard pessoal
        router.push(callbackUrl !== '/dashboard' ? callbackUrl : '/dashboard')
      }
      router.refresh()
    } catch {
      setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(email: string, password: string) {
    setValue('email', email)
    setValue('password', password)
    toast.info('Dados preenchidos — clique em Entrar')
  }

  return (
    <div className="w-full space-y-5">
      {/* Erro de login */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sucesso */}
      {loginOk && (
        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-500" />
          <span>Login realizado com sucesso! Redirecionando...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            autoFocus
            disabled={loading || loginOk}
            {...register('email')}
            onChange={(e) => {
              register('email').onChange(e)
              setErrorMsg(null)
            }}
            className={`h-11 rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500 transition-colors ${
              errors.email ? 'border-red-400 bg-red-50' : ''
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{errors.email.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">
              Senha
            </Label>
            <button
              type="button"
              className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
              onClick={() => toast.info('Recurso em breve. Entre em contato com o suporte.')}
            >
              Esqueci minha senha
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading || loginOk}
              {...register('password')}
              onChange={(e) => {
                register('password').onChange(e)
                setErrorMsg(null)
              }}
              className={`h-11 rounded-xl border-slate-200 pr-11 focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500 transition-colors ${
                errors.password ? 'border-red-400 bg-red-50' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base mt-2 shadow-md shadow-teal-200/60 transition-all"
          disabled={loading || loginOk}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</>
            : loginOk
            ? <><CheckCircle2 className="w-4 h-4 mr-2" />Redirecionando...</>
            : 'Entrar na minha conta'
          }
        </Button>
      </form>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs text-slate-400">contas de demonstração</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Demo accounts */}
      <div className="grid grid-cols-2 gap-2">
        {getDemoAccounts().map((acc) => (
          <button
            key={acc.email}
            type="button"
            onClick={() => fillDemo(acc.email, acc.password)}
            className="group flex items-center gap-2 p-3 bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 rounded-xl transition-all text-left"
          >
            <div className="w-7 h-7 bg-teal-600 group-hover:bg-teal-700 rounded-lg flex items-center justify-center shrink-0 transition-colors">
              <span className="text-white text-xs font-bold">{acc.label[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 group-hover:text-teal-700">{acc.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{acc.email}</p>
            </div>
            <ClipboardCopy className="w-3 h-3 text-slate-300 group-hover:text-teal-400 ml-auto shrink-0" />
          </button>
        ))}
      </div>

      {/* Cadastro */}
      <p className="text-center text-sm text-slate-500 pt-1">
        Não tem conta?{' '}
        <Link
          href={`/auth/register?tenant=${tenantSlug}`}
          className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
        >
          Criar conta grátis
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex flex-col gradient-gleam relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative flex-1 flex flex-col justify-between p-12">
          <Link href="/">
            <GleamLogo size="md" variant="white" />
          </Link>

          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Bem-vindo de<br />volta! 👋
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Seu painel de agendamentos está esperando.
            </p>
            <div className="space-y-3">
              {[
                '📅 Próximos agendamentos em um lugar só',
                '🔄 Cancele ou reagende com 1 clique',
                '📊 Histórico completo de limpezas',
                '🔔 Notificações em tempo real',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <span className="text-white text-[9px] font-bold">✓</span>
                  </div>
                  <span className="text-white/80 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs">© {new Date().getFullYear()} HubNestly · Limpeza residencial simplificada</p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Seletor de idioma */}
          <div className="flex justify-end mb-4">
            <LanguageSwitcher variant="light" />
          </div>
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/">
              <GleamLogo size="md" variant="dark" />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Entrar na sua conta</h1>
            <p className="text-slate-500 text-sm">Acesse seu painel de agendamentos de limpeza</p>
          </div>

          <Suspense fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            </div>
          }>
            <LoginForm />
          </Suspense>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
