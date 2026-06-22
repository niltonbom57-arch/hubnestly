import { auth } from './session'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('UNAUTHORIZED')
  }
  return session.user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN')
  }
  return user
}

/**
 * Requer que o usuário seja admin da plataforma (sem tenantId).
 * Impede que admins de tenants acessem rotas globais da plataforma.
 */
export async function requirePlatformAdmin() {
  const user = await requireAdmin()
  if (user.tenantId) {
    // Tenant admin tentando acessar rota de plataforma
    throw new Error('FORBIDDEN')
  }
  return user
}
