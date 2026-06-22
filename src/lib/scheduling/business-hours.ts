import { addMinutes, setHours, setMinutes, setSeconds, setMilliseconds, getDay } from 'date-fns'
import { toUtc, TIMEZONE } from './timezone'
import { toZonedTime } from 'date-fns-tz'
import { SCHEDULING } from '../pricing/constants'

export function isBusinessDay(utcDate: Date): boolean {
  const et = toZonedTime(utcDate, TIMEZONE)
  const day = getDay(et)
  return day >= 1 && day <= 6
}

function startOfDayEt(dateEt: Date): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(dateEt, SCHEDULING.START_HOUR), 0), 0), 0)
}

function endOfDayEt(dateEt: Date): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(dateEt, SCHEDULING.END_HOUR), 0), 0), 0)
}

export interface Slot {
  startUtc: Date
  endUtc: Date
}

export function generateSlotsForDate(dateUtc: Date, durationMinutes: number): Slot[] {
  if (!isBusinessDay(dateUtc)) return []

  const dateEt = toZonedTime(dateUtc, TIMEZONE)
  const dayStart = startOfDayEt(dateEt)
  const dayEnd = endOfDayEt(dateEt)

  const slots: Slot[] = []
  let cursor = dayStart

  while (cursor < dayEnd) {
    const slotEndEt = addMinutes(cursor, durationMinutes + SCHEDULING.TRAVEL_BLOCK_MINUTES)
    if (slotEndEt <= dayEnd) {
      slots.push({
        startUtc: toUtc(cursor),
        endUtc: toUtc(addMinutes(cursor, durationMinutes)),
      })
    }
    cursor = addMinutes(cursor, SCHEDULING.SLOT_INTERVAL_MINUTES)
  }

  return slots
}
