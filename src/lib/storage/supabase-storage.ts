import { createClient } from '@supabase/supabase-js'

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, key)
}


const BUCKET = 'tenant-assets'

export async function uploadLogo(tenantId: string, file: File): Promise<string> {
  const ext      = file.name.split('.').pop() ?? 'png'
  const path     = `${tenantId}/logo-${Date.now()}.${ext}`
  const buffer   = Buffer.from(await file.arrayBuffer())

    const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) throw new Error(`Upload falhou: ${error.message}`)

    const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadFavicon(tenantId: string, file: File): Promise<string> {
  const ext    = file.name.split('.').pop() ?? 'ico'
  const path   = `${tenantId}/favicon-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) throw new Error(`Upload falhou: ${error.message}`)

    const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
