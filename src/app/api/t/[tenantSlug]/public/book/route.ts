import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

const schema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  phone:       z.string().min(10),
  bedrooms:    z.number().int().min(1),
  bathrooms:   z.number().int().min(1),
  livingRooms: z.number().int().min(0).default(1),
  kitchens:    z.number().int().min(0).default(1),
  offices:     z.number().int().min(0).default(0),
  garages:     z.number().int().min(0).default(0),
  hasLaundry:  z.boolean().default(false),
  hasPool:     z.boolean().default(false),
  hasPatio:    z.boolean().default(false),
  hasBalcony:  z.boolean().default(false),
  hasBasement: z.boolean().default(false),
  hasGym:      z.boolean().default(false),
  cleaningType: z.enum(['standard', 'deep']).default('standard'),
  frequency:   z.enum(['once', 'weekly', 'biweekly', 'monthly']).default('once'),
  price:       z.number().positive(),
  scheduledAt: z.string().datetime(),
  teamId:      z.string(),
  address:     z.string().optional(),
  city:        z.string().optional(),
})

// POST /api/t/[tenantSlug]/public/book
// Creates a guest booking — finds or creates user, creates property + booking
export async function POST(
  req: NextRequest,
  { params }: { params: { tenantSlug: string } },
) {
  try {
    const tenant = await resolveTenantBySlug(params.tenantSlug)
    if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 422 })
    }

    const d = parsed.data

    // Upsert user (create if not exists, keeping existing password)
    let user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: d.email } },
    })

    if (!user) {
      // Create user with temporary password (client will receive email to set password later)
      const tempPw = await bcrypt.hash(Math.random().toString(36).slice(-10), 10)
      user = await prisma.user.create({
        data: {
          name:           d.name,
          email:          d.email,
          phone:          d.phone,
          hashedPassword: tempPw,
          role:           Role.CLIENT,
          tenantId:       tenant.id,
        },
      })
    } else {
      // Update name/phone if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { name: d.name, phone: d.phone },
      })
    }

    // Create property
    const property = await prisma.property.create({
      data: {
        userId:          user.id,
        tenantId:        tenant.id,
        nickname:        `${d.bedrooms}bd/${d.bathrooms}ba`,
        address:         d.address ?? '',
        city:            d.city ?? 'Fort Myers',
        bedrooms:        d.bedrooms,
        bathrooms:       d.bathrooms,
        extraRooms:      d.offices,
        hasLaundry:      d.hasLaundry,
        hasGarage:       d.garages > 0,
        hasPool:         d.hasPool,
        hasPatio:        d.hasPatio,
        calculatedPrice: d.price,
      },
    })

    // Estimate duration: 90 min base + 30 per bedroom + 20 per bathroom
    const estimatedDuration =
      90 + d.bedrooms * 30 + d.bathrooms * 20 + (d.cleaningType === 'deep' ? 30 : 0)

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId:            user.id,
        tenantId:          tenant.id,
        propertyId:        property.id,
        teamId:            d.teamId,
        scheduledAt:       new Date(d.scheduledAt),
        estimatedDuration,
        price:             d.price,
        status:            'PENDING',
        notes:             `Frequência: ${d.frequency}. Tipo: ${d.cleaningType === 'deep' ? 'Profunda' : 'Padrão'}.`,
      },
    })

    // Create time block for the booking
    const endAt = new Date(new Date(d.scheduledAt).getTime() + estimatedDuration * 60_000)
    await prisma.timeBlock.create({
      data: {
        tenantId:  tenant.id,
        startAt:   new Date(d.scheduledAt),
        endAt,
        type:      'BOOKING',
        bookingId: booking.id,
        teamId:    d.teamId,
      },
    })

    return NextResponse.json({
      success:   true,
      bookingId: booking.id,
      userId:    user.id,
      isNew:     !user,
    })
  } catch (e) {
    console.error('[public/book]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
