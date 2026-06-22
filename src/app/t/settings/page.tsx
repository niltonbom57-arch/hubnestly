/**
 * /t/settings — Redirect para /t/[slug]/admin/settings
 * Usado pelo callback do Stripe Connect.
 */
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

interface Props {
  searchParams: { stripe_connected?: string; stripe_error?: string }
}

export default async function SettingsRedirectPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { tenantSlug?: string } | undefined

  const slug = user?.tenantSlug
  if (!slug) redirect('/auth/login')

  const qs = new URLSearchParams()
  if (searchParams.stripe_connected) qs.set('stripe_connected', searchParams.stripe_connected)
  if (searchParams.stripe_error)     qs.set('stripe_error', searchParams.stripe_error)

  const query = qs.toString() ? `?${qs.toString()}` : ''
  redirect(`/t/${slug}/admin/settings${query}`)
}
