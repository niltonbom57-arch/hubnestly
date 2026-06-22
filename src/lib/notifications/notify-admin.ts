import { prisma } from '@/lib/db/prisma'
import { sendBookingConfirmedEmail } from './send-email'
import { sendBookingConfirmedSms } from './send-sms'

export interface NotifyAdminParams {
  tenantId: string
  bookingId: string
  clientName: string
  propertyNickname: string
  propertyAddress: string
  scheduledAt: Date
  totalPrice: number
}

export async function notifyAdminBookingConfirmed(params: NotifyAdminParams): Promise<void> {
  // Busca admins + settings do tenant em paralelo
  const [admins, settings] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: params.tenantId, role: 'ADMIN' },
      select: { name: true, email: true, phone: true },
    }),
    prisma.tenantSettings.findUnique({
      where: { tenantId: params.tenantId },
      select: { supportPhone: true, supportEmail: true },
    }),
  ])

  if (admins.length === 0) return

  const dateStr = params.scheduledAt.toLocaleString('pt-BR', {
    timeZone: 'America/New_York',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  const title = `Novo agendamento confirmado`
  const body  = `${params.clientName} agendou limpeza em "${params.propertyNickname}" para ${dateStr} (ET) — $${params.totalPrice.toFixed(2)}`

  // Salva notificação no banco (aparece no painel admin)
  await prisma.notification.create({
    data: {
      tenantId:  params.tenantId,
      bookingId: params.bookingId,
      type:      'BOOKING_CONFIRMED',
      title,
      body,
    },
  })

  // Destinatários: admins cadastrados + email/telefone de suporte da empresa
  const emailRecipients = new Set<string>(admins.map((a) => a.email))
  if (settings?.supportEmail) emailRecipients.add(settings.supportEmail)

  const phoneRecipients = new Set<string>()
  admins.forEach((a) => { if (a.phone) phoneRecipients.add(a.phone) })
  if (settings?.supportPhone) phoneRecipients.add(settings.supportPhone)

  const tasks: Promise<void>[] = []

  // Emails
  Array.from(emailRecipients).forEach((email) => {
    const admin = admins.find((a) => a.email === email)
    tasks.push(
      sendBookingConfirmedEmail({
        adminEmail:        email,
        adminName:         admin?.name ?? 'Administrador',
        clientName:        params.clientName,
        propertyNickname:  params.propertyNickname,
        propertyAddress:   params.propertyAddress,
        scheduledAt:       params.scheduledAt,
        totalPrice:        params.totalPrice,
        bookingId:         params.bookingId,
      }).catch((e: unknown) => console.error('[Email] Falha:', e)),
    )
  })

  // SMS
  Array.from(phoneRecipients).forEach((phone) => {
    tasks.push(
      sendBookingConfirmedSms({
        adminPhone:       phone,
        clientName:       params.clientName,
        propertyNickname: params.propertyNickname,
        scheduledAt:      params.scheduledAt,
        totalPrice:       params.totalPrice,
      }).catch((e: unknown) => console.error('[SMS] Falha:', e)),
    )
  })

  await Promise.allSettled(tasks)
}
