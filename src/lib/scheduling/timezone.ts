import { toZonedTime, fromZonedTime, format } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

export const TIMEZONE = 'America/New_York'

export function toEt(utcDate: Date): Date {
  return toZonedTime(utcDate, TIMEZONE)
}

export function toUtc(etDate: Date): Date {
  return fromZonedTime(etDate, TIMEZONE)
}

export function formatEt(utcDate: Date, fmt: string): string {
  return format(toZonedTime(utcDate, TIMEZONE), fmt, { timeZone: TIMEZONE, locale: ptBR })
}

export function nowUtc(): Date {
  return new Date()
}

export function nowEt(): Date {
  return toEt(new Date())
}
