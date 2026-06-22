import { getAvailability } from '@/lib/scheduling/get-availability'
import { toUtc } from '@/lib/scheduling/timezone'

const teams = [{ id: 'team-1' }, { id: 'team-2' }]

function etDate(year: number, month: number, day: number, hour = 0): Date {
  return toUtc(new Date(year, month - 1, day, hour, 0, 0, 0))
}

describe('getAvailability', () => {
  const monday = etDate(2026, 6, 22)
  const duration = 220

  it('retorna slots disponíveis para um dia sem bloqueios', () => {
    const now = etDate(2026, 6, 20) // 2 dias antes = dentro do limite de 24h
    const slots = getAvailability({ dateUtc: monday, durationMinutes: duration, teams, existingBlocks: [], nowUtc: now })
    expect(slots.length).toBeGreaterThan(0)
  })

  it('não retorna slots antes de 24h no futuro', () => {
    // now = meia-noite ET da segunda → minBookableAt = meia-noite ET terça
    // todos os slots de segunda ficam ANTES de terça → filtrados
    const now = etDate(2026, 6, 22, 0) // meia-noite ET segunda
    const slots = getAvailability({ dateUtc: monday, durationMinutes: duration, teams, existingBlocks: [], nowUtc: now })
    expect(slots.length).toBe(0)
  })

  it('não retorna slots quando todos os times estão bloqueados', () => {
    const now = etDate(2026, 6, 20)
    // Bloqueia o dia inteiro para ambos os times
    const blocks = [
      { startAt: etDate(2026, 6, 22, 0), endAt: etDate(2026, 6, 23, 0), teamId: 'team-1' },
      { startAt: etDate(2026, 6, 22, 0), endAt: etDate(2026, 6, 23, 0), teamId: 'team-2' },
    ]
    const slots = getAvailability({ dateUtc: monday, durationMinutes: duration, teams, existingBlocks: blocks, nowUtc: now })
    expect(slots.length).toBe(0)
  })

  it('usa time-2 quando time-1 está bloqueado', () => {
    const now = etDate(2026, 6, 20)
    const blocks = [
      { startAt: etDate(2026, 6, 22, 0), endAt: etDate(2026, 6, 23, 0), teamId: 'team-1' },
    ]
    const slots = getAvailability({ dateUtc: monday, durationMinutes: duration, teams, existingBlocks: blocks, nowUtc: now })
    expect(slots.every((s) => s.teamId === 'team-2')).toBe(true)
  })

  it('retorna [] para domingo', () => {
    const sunday = etDate(2026, 6, 28)
    const now = etDate(2026, 6, 26)
    const slots = getAvailability({ dateUtc: sunday, durationMinutes: duration, teams, existingBlocks: [], nowUtc: now })
    expect(slots.length).toBe(0)
  })
})
