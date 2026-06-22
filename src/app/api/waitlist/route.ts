import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'

const schema = z.object({
  companyName: z.string().min(2, 'Nome da empresa obrigatório'),
  ownerName:   z.string().min(2, 'Seu nome é obrigatório'),
  email:       z.string().email('Email inválido'),
  phone:       z.string().optional(),
  city:        z.string().optional(),
  teamCount:   z.string().optional(),
  message:     z.string().optional(),
  source:      z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 },
      )
    }

    // Verifica se já existe na lista (sem bloquear, só registra novamente)
    const existing = await prisma.waitlist.findFirst({
      where: { email: parsed.data.email },
    })

    if (existing) {
      // Já cadastrado — retorna sucesso sem duplicar
      return NextResponse.json({ success: true, alreadyRegistered: true })
    }

    await prisma.waitlist.create({
      data: {
        companyName: parsed.data.companyName,
        ownerName:   parsed.data.ownerName,
        email:       parsed.data.email,
        phone:       parsed.data.phone,
        city:        parsed.data.city,
        teamCount:   parsed.data.teamCount,
        message:     parsed.data.message,
        source:      parsed.data.source ?? 'para-empresas',
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno. Tente novamente.' },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Endpoint para admin ver a lista (sem auth por ora — apenas retorna total)
  const total = await prisma.waitlist.count()
  return NextResponse.json({ total })
}
