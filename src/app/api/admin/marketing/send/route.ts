export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db/prisma'
import { ok, err, unauthorized, serverError } from '@/lib/api/response'

const sendSchema = z.object({
  subject: z.string().min(1, 'Assunto é obrigatório').max(200),
  body: z.string().min(1, 'Mensagem é obrigatória'),
  recipientIds: z.array(z.string()).default([]),
  sendToAll: z.boolean().default(false),
})

function buildHtml(body: string, recipientName: string, companyName: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
    .replace(/\{\{nome_cliente\}\}/g, `<strong>${recipientName}</strong>`)
    .replace(/\{\{empresa\}\}/g, `<strong>${companyName}</strong>`)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:sans-serif;background:#f1f5f9;padding:40px 0;margin:0">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">
    <div style="background:#0d9488;padding:32px 40px">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">${companyName}</h1>
    </div>
    <div style="padding:40px;color:#334155;font-size:16px;line-height:1.7">${escaped}</div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;font-size:12px;color:#94a3b8">
      © ${new Date().getFullYear()} ${companyName}. Todos os direitos reservados.<br/>
      Você está recebendo este email pois é cliente de ${companyName}.<br/>
      Para cancelar o recebimento, entre em contato com ${companyName}.
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'ADMIN') return unauthorized()

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return err('Configure o Resend nas configurações')

    const body = await req.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Dados inválidos')

    const { subject, body: messageBody, recipientIds, sendToAll } = parsed.data

    // Fetch tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { name: true },
    })

    const companyName = tenant?.name ?? 'HubNestly'
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@hubnestly.com'
    const fromDisplay = `${companyName} <${fromEmail}>`

    // Fetch recipients
    const recipients = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        role: 'CLIENT',
        ...(sendToAll ? {} : { id: { in: recipientIds } }),
      },
      select: { id: true, name: true, email: true },
    })

    if (recipients.length === 0) return err('Nenhum destinatário encontrado')

    const resend = new Resend(apiKey)
    let sent = 0
    let failed = 0

    // Send in batches of 10
    for (let i = 0; i < recipients.length; i += 10) {
      const batch = recipients.slice(i, i + 10)
      const results = await Promise.allSettled(
        batch.map((r) =>
          resend.emails.send({
            from: fromDisplay,
            to: r.email,
            subject,
            html: buildHtml(messageBody, r.name ?? 'Cliente', companyName),
          })
        )
      )
      for (const result of results) {
        if (result.status === 'fulfilled') sent++
        else failed++
      }
    }

    return ok({ sent, failed })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return unauthorized()
    console.error('[POST /api/admin/marketing/send]', error)
    return serverError()
  }
}
