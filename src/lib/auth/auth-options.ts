import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from './password'
import { loginSchema } from '@/lib/validation/schemas/auth'
import { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  // Sem PrismaAdapter — usamos JWT puro (mais simples, sem conflito com tenantId obrigatório)
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error:  '/auth/login',
  },
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:      { label: 'Email',    type: 'email'    },
        password:   { label: 'Senha',    type: 'password' },
        tenantSlug: { label: 'Empresa',  type: 'text'     },
      },
      async authorize(credentials) {
        try {
          // 1. Valida email + senha
          const parsed = loginSchema.safeParse(credentials)
          if (!parsed.success) return null

          const { email, password } = parsed.data
          const tenantSlug = (credentials as Record<string, string>).tenantSlug?.trim() || null

          // 2. Resolve o tenant
          let tenantId: string | null = null

          if (tenantSlug) {
            const tenant = await prisma.tenant.findUnique({
              where:  { slug: tenantSlug },
              select: { id: true, status: true },
            })
            if (!tenant) {
              // Empresa não encontrada — retorna erro específico
              throw new Error('TENANT_NOT_FOUND')
            }
            if (tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
              throw new Error('TENANT_INACTIVE')
            }
            tenantId = tenant.id
          } else {
            // Sem slug: busca pelo único tenant ativo (MVP single-tenant)
            const tenant = await prisma.tenant.findFirst({
              where:  { status: { in: ['ACTIVE', 'TRIAL'] } },
              select: { id: true },
              orderBy: { createdAt: 'asc' },
            })
            tenantId = tenant?.id ?? null
          }

          if (!tenantId) return null

          // 3. Busca o usuário no escopo do tenant
          const user = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email } },
            select: {
              id:              true,
              name:            true,
              email:           true,
              image:           true,
              role:            true,
              tenantId:        true,
              isPlatformAdmin: true,
              hashedPassword:  true,
              tenant: { select: { slug: true } },
            },
          })

          if (!user) throw new Error('INVALID_CREDENTIALS')
          if (!user.hashedPassword) throw new Error('INVALID_CREDENTIALS') // conta Google sem senha

          // 4. Verifica a senha
          const valid = await verifyPassword(password, user.hashedPassword)
          if (!valid) throw new Error('INVALID_CREDENTIALS')

          // 5. Retorna o payload do JWT
          return {
            id:              user.id,
            name:            user.name,
            email:           user.email,
            image:           user.image ?? null,
            role:            user.role,
            tenantId:        user.tenantId,
            tenantSlug:      user.tenant.slug,
            isPlatformAdmin: user.isPlatformAdmin,
          }
        } catch (e) {
          // Propaga erros específicos para o callback de erro do NextAuth
          if (e instanceof Error) throw e
          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Só processa login social (Google)
      if (account?.provider !== 'google') return true

      try {
        // Busca tenant padrão
        const tenant = await prisma.tenant.findFirst({
          where:   { status: { in: ['ACTIVE', 'TRIAL'] } },
          select:  { id: true, slug: true },
          orderBy: { createdAt: 'asc' },
        })
        if (!tenant) return false

        // Cria ou atualiza usuário
        await prisma.user.upsert({
          where:  { tenantId_email: { tenantId: tenant.id, email: user.email! } },
          update: { name: user.name ?? undefined, image: user.image ?? undefined },
          create: {
            email:          user.email!,
            name:           user.name  ?? 'Usuário',
            image:          user.image ?? null,
            role:           Role.CLIENT,
            tenantId:       tenant.id,
            isPlatformAdmin: false,
          },
        })

        return true
      } catch {
        return false
      }
    },

    async jwt({ token, user, trigger }) {
      // Na primeira geração do token (login), sempre busca dados frescos do banco
      if (user || trigger === 'signIn') {
        const userId = (user as { id?: string })?.id ?? token.sub
        if (userId) {
          try {
            const dbUser = await prisma.user.findUnique({
              where:  { id: userId },
              select: {
                id:              true,
                role:            true,
                tenantId:        true,
                isPlatformAdmin: true,
                tenant:          { select: { slug: true } },
              },
            })
            if (dbUser) {
              token.id             = dbUser.id
              token.sub            = dbUser.id
              token.role           = dbUser.role
              token.tenantId       = dbUser.tenantId
              token.tenantSlug     = dbUser.tenant?.slug ?? ''
              token.isPlatformAdmin = dbUser.isPlatformAdmin
              return token
            }
          } catch {
            // silencioso
          }
        }

        // Fallback: usa dados do objeto user se DB falhar
        if (user) {
          token.sub             = (user as { id: string }).id
          token.id              = (user as { id: string }).id
          token.role            = (user as { role?: Role }).role             ?? Role.CLIENT
          token.tenantId        = (user as { tenantId?: string }).tenantId   ?? ''
          token.tenantSlug      = (user as { tenantSlug?: string }).tenantSlug ?? ''
          token.isPlatformAdmin = (user as { isPlatformAdmin?: boolean }).isPlatformAdmin ?? false
        }
      }

      // Para login via Google (sem id no objeto user), busca pelo email
      if (!token.id && token.email) {
        try {
          const tenant = await prisma.tenant.findFirst({
            where:   { status: { in: ['ACTIVE', 'TRIAL'] } },
            select:  { id: true },
            orderBy: { createdAt: 'asc' },
          })
          if (tenant) {
            const dbUser = await prisma.user.findUnique({
              where:  { tenantId_email: { tenantId: tenant.id, email: token.email } },
              select: {
                id:              true,
                role:            true,
                tenantId:        true,
                isPlatformAdmin: true,
                tenant:          { select: { slug: true } },
              },
            })
            if (dbUser) {
              token.id             = dbUser.id
              token.sub            = dbUser.id
              token.role           = dbUser.role
              token.tenantId       = dbUser.tenantId
              token.tenantSlug     = dbUser.tenant?.slug ?? ''
              token.isPlatformAdmin = dbUser.isPlatformAdmin
            }
          }
        } catch {
          // silencioso
        }
      }

      return token
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id:              (token.id   ?? token.sub) as string,
          role:            token.role            as string,
          tenantId:        token.tenantId        as string,
          tenantSlug:      token.tenantSlug      as string,
          isPlatformAdmin: token.isPlatformAdmin as boolean,
        },
      }
    },
  },
}
