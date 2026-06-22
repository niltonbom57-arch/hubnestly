export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { uploadLogo, uploadFavicon } from '@/lib/storage/supabase-storage'
import { ok, err, unauthorized, serverError } from '@/lib/api/response'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'ADMIN') return unauthorized()

    const formData = await req.formData()
    const logo     = formData.get('logo')     as File | null
    const favicon  = formData.get('favicon')  as File | null
    const type     = formData.get('type')     as string | null  // 'logo' | 'favicon'

    if (!logo && !favicon) return err('Nenhum arquivo enviado')

    const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
    const ALLOWED  = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']

    const file = logo ?? favicon!
    if (file.size > MAX_SIZE) return err('Arquivo muito grande (máximo 2 MB)')
    if (!ALLOWED.includes(file.type)) return err('Formato inválido (PNG, JPG, WebP, ICO)')

    let url: string
    if (type === 'favicon' || favicon) {
      url = await uploadFavicon(user.tenantId, file)
      await prisma.tenantSettings.upsert({
        where:  { tenantId: user.tenantId },
        create: { tenantId: user.tenantId, faviconUrl: url },
        update: { faviconUrl: url },
      })
    } else {
      url = await uploadLogo(user.tenantId, file)
      await prisma.tenantSettings.upsert({
        where:  { tenantId: user.tenantId },
        create: { tenantId: user.tenantId, logoUrl: url },
        update: { logoUrl: url },
      })
    }

    return ok({ url })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return unauthorized()
    console.error('[Logo Upload]', e)
    return serverError()
  }
}
