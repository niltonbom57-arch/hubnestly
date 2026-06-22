import { isBusinessDay, generateSlotsForDate } from '@/lib/scheduling/business-hours'
import { toUtc } from '@/lib/scheduling/timezone'

function etDate(year: number, month: number, day: number, hour = 8): Date {
  return toUtc(new Date(year, month - 1, day, hour, 0, 0, 0))
}

describe('isBusinessDay', () => {
  it('segunda a sábado são dias úteis', () => {
    expect(isBusinessDay(etDate(2026, 6, 22))).toBe(true) // segunda
    expect(isBusinessDay(etDate(2026, 6, 23))).toBe(true) // terça
    expect(isBusinessDay(etDate(2026, 6, 27))).toBe(true) // sábado
  })

  it('domingo não é dia útil', () => {
    expect(isBusinessDay(etDate(2026, 6, 28))).toBe(false) // domingo
  })
})

describe('generateSlotsForDate', () => {
  const monday = etDate(2026, 6, 22) // segunda-feira
  const sunday = etDate(2026, 6, 28) // domingo
  const duration = 220 // 3 quartos + 2 banheiros

  it('retorna [] para domingo', () => {
    expect(generateSlotsForDate(sunday, duration)).toHaveLength(0)
  })

  it('retorna slots para segunda-feira', () => {
    const slots = generateSlotsForDate(monday, duration)
    expect(slots.length).toBeGreaterThan(0)
  })

  it('nenhum slot ultrapassa 18h ET (incluindo viagem de 40min)', () => {
    const slots = generateSlotsForDate(monday, duration)
    for (const slot of slots) {
      const endWithTravel = new Date(slot.endUtc.getTime() + 40 * 60 * 1000)
      const etEnd = new Date(endWithTravel.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      expect(etEnd.getHours()).toBeLessThanOrEqual(18)
    }
  })

  it('primeiro slot começa às 8h ET', () => {
    const slots = generateSlotsForDate(monday, duration)
    const first = slots[0]
    expect(first).toBeDefined()
    if (!first) return
    const etStart = new Date(first.startUtc.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    expect(etStart.getHours()).toBe(8)
    expect(etStart.getMinutes()).toBe(0)
  })
})
