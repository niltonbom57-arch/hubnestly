'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { HubNestlyLogo as GleamLogo } from '@/components/ui/HubNestlyLogo'

const schema = z.object({
  name:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email:    z.string().email('Email inválido'),
  phone:    z.string().optional(),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'As senhas não coincidem',
  path: ['confirm'],
})

type FormValues = z.infer<typeof schema>

function RegisterForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const tenantSlug = searchParams.get('tenant') ?? 'cleanbookfl'

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: data.name, email: data.email, phone: data.phone, password: data.password, tenantSlug }),
      })

      const json: { success: boolean; error?: string } = await res.json()

      if (!json.success) {
        if (res.status === 409) toast.error('Este email já está cadastrado. Tente fazer login.')
        else if (res.status === 404) toast.error('Empresa não encontrada. Verifique o link de cadastro.')
        else toast.error(json.error ?? 'Erro ao criar conta. Tente novamente.')
        return
      }

      toast.success('Conta criada! Fazendo login...')

      const login = await signIn('credentials', { email: data.email, password: data.password, tenantSlug, redirect: false })
      if (login?.error) {
        toast.info('Conta criada! Faça login para continuar.')
        router.push(`/auth/login?tenant=${tenantSlug}`)
        return
      }

      // Aguarda cookie ser gravado e usa rota server-side para redirect correto
      await new Promise((r) => setTimeout(r, 600))
      window.location.href = '/api/auth/redirect'
    } catch {
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="name" className="text-slate-700 font-medium">Nome completo</Label>
          <Input
            id="name"
            placeholder="Maria Silva"
            autoComplete="name"
            {...register('name')}
            className={`h-11 rounded-xl border-slate-200 focus-visible:ring-teal-500/30 focus-visible:border-teal-500 ${errors.name ? 'border-red-400' : ''}`}
          />
          {errors.name && <p className="text-red-500 text-xs">⚠ {errors.name.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            {...register('email')}
            className={`h-11 rounded-xl border-slate-200 focus-visible:ring-teal-500/30 focus-visible:border-teal-500 ${errors.email ? 'border-red-400' : ''}`}
          />
          {errors.email && <p className="text-red-500 text-xs">⚠ {errors.email.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="phone" className="text-slate-700 font-medium">
            Telefone <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(239) 555-0100"
            autoComplete="tel"
            {...register('phone')}
            className="h-11 rounded-xl border-slate-200 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
          />
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="password" className="text-slate-700 font-medium">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              {...register('password')}
              className={`h-11 rounded-xl border-slate-200 pr-10 focus-visible:ring-teal-500/30 focus-visible:border-teal-500 ${errors.password ? 'border-red-400' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs">⚠ {errors.password.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="confirm" className="text-slate-700 font-medium">Confirmar senha</Label>
          <Input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repita a senha"
            autoComplete="new-password"
            {...register('confirm')}
            className={`h-11 rounded-xl border-slate-200 focus-visible:ring-teal-500/30 focus-visible:border-teal-500 ${errors.confirm ? 'border-red-400' : ''}`}
          />
          {errors.confirm && <p className="text-red-500 text-xs">⚠ {errors.confirm.message}</p>}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Ao criar sua conta você concorda com nossos{' '}
        <a href="#" className="text-teal-600 hover:underline">Termos de uso</a> e{' '}
        <a href="#" className="text-teal-600 hover:underline">Política de privacidade</a>.
      </p>

      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
        disabled={loading}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando sua conta...</>
          : 'Criar conta gratuita'}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Já tem conta?{' '}
        <Link href={`/auth/login?tenant=${tenantSlug}`} className="text-teal-600 hover:underline font-semibold">
          Fazer login
        </Link>
      </p>
    </form>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-white order-2 lg:order-1">
        <div className="w-full max-w-lg">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher variant="light" />
          </div>
          <div className="lg:hidden mb-8 text-center">
            <Link href="/">
              <GleamLogo size="md" variant="dark" />
            </Link>
          </div>

          <div className="mb-8">
            <Link href="/auth/register" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors mb-4">
              <ArrowLeft className="w-3 h-3" /> Voltar à escolha de conta
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Criar conta de cliente</h1>
            <p className="text-slate-500 text-sm">Agende limpezas, veja preços e pague online com segurança.</p>
          </div>

          <Suspense fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            </div>
          }>
            <RegisterForm />
          </Suspense>

          <div className="mt-8 text-center">
            <Link href="/auth/register" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Voltar à escolha de conta
            </Link>
          </div>
        </div>
      </div>

      {/* Right — branding panel */}
      <div className="hidden lg:flex flex-col gradient-gleam relative overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative flex-1 flex flex-col justify-between p-12">
          <Link href="/">
            <GleamLogo size="md" variant="white" />
          </Link>
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Sua primeira limpeza<br />pode ser hoje mesmo 🏠
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Cadastre-se, calcule o preço e agende tudo em menos de 3 minutos.
            </p>
            <div className="space-y-4">
              {[
                { icon: '⚡', text: 'Confirmação instantânea por email' },
                { icon: '💰', text: 'Preço calculado automaticamente' },
                { icon: '🛡️', text: 'Pagamento 100% seguro via Stripe' },
                { icon: '📅', text: 'Cancele ou reagende quando quiser' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-white/90 text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-xs">© {new Date().getFullYear()} HubNestly Inc.</p>
        </div>
      </div>
    </div>
  )
}
