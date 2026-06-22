import { addHours, addMinutes } from 'date-fns'
import { generateSlotsForDate } from './business-hours'
import { hasConflict, TimeRange } from './check-conflict'
import { SCHEDULING } from '../pricing/constants'

export interface AvailableSlot {
  startUtc: Date
  endUtc: Date
  teamId: string
}

export interface GetAvailabilityInput {
  dateUtc: Date
  durationMinutes: number
  teams: Array<{ id: string }>
  existingBlocks: TimeRange[]
  nowUtc?: Date
}

export function getAvailability({
  dateUtc,
  durationMinutes,
  teams,
  existingBlocks,
  nowUtc = new Date(),
}: GetAvailabilityInput): AvailableSlot[] {
  const minBookableAt = addHours(nowUtc, SCHEDULING.MIN_ADVANCE_HOURS)
  const slots = generateSlotsForDate(dateUtc, durationMinutes)
  const available: AvailableSlot[] = []

  for (const slot of slots) {
    if (slot.startUtc < minBookableAt) continue

    for (const team of teams) {
      const blockEnd = addMinutes(slot.endUtc, SCHEDULING.TRAVEL_BLOCK_MINUTES)
      const candidate = { startAt: slot.startUtc, endAt: blockEnd }

      if (!hasConflict(candidate, existingBlocks, team.id)) {
        available.push({ startUtc: slot.startUtc, endUtc: slot.endUtc, teamId: team.id })
        break
      }
    }
  }

  return available
}
