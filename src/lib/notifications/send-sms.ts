import twilio from 'twilio'

export interface BookingConfirmedSmsData {
  adminPhone: string
  clientName: string
  propertyNickname: string
  scheduledAt: Date
  totalPrice: number
}

export async function sendBookingConfirmedSms(data: BookingConfirmedSmsData): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const fromPhone  = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromPhone) {
    console.warn('[SMS] Credenciais Twilio não configuradas — SMS não enviado')
    return
  }

  const dateStr = data.scheduledAt.toLocaleString('pt-BR', {
    timeZone: 'America/New_York',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const client = twilio(accountSid, authToken)

  await client.messages.create({
    to: data.adminPhone,
    from: fromPhone,
    body: [
      `✅ NESTLY — Novo agendamento!`,
      `Cliente: ${data.clientName}`,
      `Imóvel: ${data.propertyNickname}`,
      `Data: ${dateStr} (ET)`,
      `Total: $${data.totalPrice.toFixed(2)}`,
      `Acesse o painel para mais detalhes.`,
    ].join('\n'),
  })
}
