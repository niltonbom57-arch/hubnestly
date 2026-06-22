import { prisma } from '@/lib/db/prisma'
import type { Tenant } from '@prisma/client'

// Cache simples em memória com TTL de 60s
interface CacheEntry {
  tenant: Tenant
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const TTL_MS = 60_000

function getCached(key: string): Tenant | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.tenant
}

function setCached(key: string, tenant: Tenant): void {
  cache.set(key, { tenant, expiresAt: Date.now() + TTL_MS })
}

export function invalidateTenantCache(slug: string): void {
  cache.delete(`slug:${slug}`)
}

export async function resolveTenantBySlug(slug: string): Promise<Tenant | null> {
  const cached = getCached(`slug:${slug}`)
  if (cached) return cached

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (tenant) setCached(`slug:${slug}`, tenant)
  return tenant
}

export async function resolveTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const cached = getCached(`sub:${subdomain}`)
  if (cached) return cached

  const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
  if (tenant) setCached(`sub:${subdomain}`, tenant)
  return tenant
}

export async function resolveTenantByCustomDomain(domain: string): Promise<Tenant | null> {
  const cached = getCached(`domain:${domain}`)
  if (cached) return cached

  const tenant = await prisma.tenant.findUnique({ where: { customDomain: domain } })
  if (tenant) setCached(`domain:${domain}`, tenant)
  return tenant
}

/**
 * Resolve o tenant a partir de um Request do Next.js.
 * Ordem: custom domain → subdomínio → path /t/[slug]
 */
export async function resolveTenantFromRequest(
  host: string,
  pathname: string,
): Promise<Tenant | null> {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'cleanbookfl.com'

  // 1. Custom domain (ex: empresa.com)
  if (!host.endsWith(rootDomain) && !host.includes('localhost') && !host.includes('vercel.app')) {
    return resolveTenantByCustomDomain(host)
  }

  // 2. Subdomínio (ex: empresa.cleanbookfl.com)
  const subdomain = host.replace(`.${rootDomain}`, '').replace('.localhost:3000', '')
  if (subdomain && subdomain !== 'www' && subdomain !== host) {
    return resolveTenantBySubdomain(subdomain)
  }

  // 3. Path /t/[slug]
  const match = pathname.match(/^\/t\/([^\/]+)/)
  if (match?.[1]) {
    return resolveTenantBySlug(match[1])
  }

  return null
}
