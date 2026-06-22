import { AsyncLocalStorage } from 'async_hooks'

interface TenantContext {
  tenantId: string
  tenantSlug: string
}

const storage = new AsyncLocalStorage<TenantContext>()

export function runWithTenant<T>(ctx: TenantContext, fn: () => T): T {
  return storage.run(ctx, fn)
}

export function getTenantContext(): TenantContext | null {
  return storage.getStore() ?? null
}

export function requireTenantContext(): TenantContext {
  const ctx = storage.getStore()
  if (!ctx) throw new Error('Nenhum contexto de tenant ativo nesta requisição')
  return ctx
}
