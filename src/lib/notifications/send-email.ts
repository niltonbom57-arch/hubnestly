import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface BookingConfirmedEmailData {
  adminEmail: string
  adminName: string
  clientName: string
  propertyNickname: string
  propertyAddress: string
  scheduledAt: Date
  totalPrice: number
  bookingId: string
}

export async function sendBookingConfirmedEmail(data: BookingConfirmedEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY não configurado — email não enviado')
    return
  }

  const dateStr = data.scheduledAt.toLocaleString('pt-BR', {
    timeZone: 'America/New_York',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@hubnestly.com',
    to: data.adminEmail,
    subject: `✅ Novo agendamento confirmado — ${data.propertyNickname}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 28px 32px;">
              <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">HubNestly</p>
              <h1 style="margin: 8px 0 0; color: white; font-size: 22px; font-weight: 800;">✅ Novo agendamento confirmado!</h1>
            </div>

            <!-- Body -->
            <div style="padding: 28px 32px;">
              <p style="color: #475569; margin: 0 0 20px;">Olá, <strong>${data.adminName}</strong>! Um novo agendamento foi <strong>pago e confirmado</strong>.</p>

              <!-- Card -->
              <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Cliente</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${data.clientName}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Imóvel</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${data.propertyNickname}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Endereço</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${data.propertyAddress}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Data e hora</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${dateStr} (ET)</td></tr>
                  <tr style="border-top: 1px solid #99f6e4;"><td style="padding: 12px 0 0; color: #64748b; font-size: 13px;">Total pago</td><td style="padding: 12px 0 0; font-weight: 800; color: #0d9488; font-size: 20px; text-align: right;">$${data.totalPrice.toFixed(2)}</td></tr>
                </table>
              </div>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${data.bookingId}"
                 style="display: block; background: #0d9488; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
                Ver agendamento no painel →
              </a>
            </div>

            <!-- Footer -->
            <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">HubNestly — Home Care Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
