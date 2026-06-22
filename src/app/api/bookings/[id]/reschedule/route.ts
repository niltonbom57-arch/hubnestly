import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/session'
import { findBookingById, rescheduleBooking } from '@/lib/repositories/booking-repository'

const schema = z.object({
  scheduledAt: z.string().datetime(),
  teamId:      z.string().min(1),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const booking = await findBookingById(params.id, session.user.id)
  if (!booking) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

  const reschedulable = ['PENDING', 'CONFIRMED', 'PAID']
  if (!reschedulable.includes(booking.status)) {
    return NextResponse.json({ error: 'Este agendamento não pode ser reagendado' }, { status: 400 })
  }

  if (!session.user.tenantId) return NextResponse.json({ error: 'Tenant inválido' }, { status: 400 })

  try {
    const updated = await rescheduleBooking(
      params.id,
      new Date(parsed.data.scheduledAt),
      parsed.data.teamId,
      session.user.tenantId,
    )
    return NextResponse.json({ success: true, booking: updated })
  } catch (e) {
    if (e instanceof Error && e.message === 'CONFLICT')
      return NextResponse.json({ error: 'Horário indisponível para o time selecionado' }, { status: 409 })
    if (e instanceof Error && e.message === 'NOT_FOUND')
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    const msg = e instanceof Error ? e.message : 'Erro ao reagendar'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
