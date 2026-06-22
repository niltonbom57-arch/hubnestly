import { prisma } from '@/lib/db/prisma'
import { TimeBlockType } from '@prisma/client'
import { startOfDay, endOfDay } from 'date-fns'
import { toUtc } from '@/lib/scheduling/timezone'
import { toZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/New_York'

export async function findTimeBlocksForDate(dateUtc: Date, tenantId: string) {
  const dateEt = toZonedTime(dateUtc, TIMEZONE)
  const dayStartEt = startOfDay(dateEt)
  const dayEndEt = endOfDay(dateEt)

  return prisma.timeBlock.findMany({
    where: {
      tenantId,
      startAt: { gte: toUtc(dayStartEt) },
      endAt: { lte: toUtc(dayEndEt) },
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      type: true,
      teamId: true,
      bookingId: true,
    },
  })
}

export async function findTimeBlocksInRange(startAt: Date, endAt: Date, tenantId: string) {
  return prisma.timeBlock.findMany({
    where: {
      tenantId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true, startAt: true, endAt: true, teamId: true, type: true },
  })
}

export async function createTimeBlock(data: {
  tenantId: string
  startAt: Date
  endAt: Date
  type: TimeBlockType
  bookingId?: string
  teamId?: string
  createdByAdmin?: boolean
}) {
  return prisma.timeBlock.create({ data })
}

export async function deleteTimeBlock(id: string) {
  return prisma.timeBlock.delete({ where: { id } })
}
