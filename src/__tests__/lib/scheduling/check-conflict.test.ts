import { hasConflict } from '@/lib/scheduling/check-conflict'

const teamId = 'team-1'

function d(h: number, m = 0): Date {
  return new Date(2026, 0, 15, h, m, 0, 0)
}

describe('hasConflict', () => {
  it('retorna false quando não há blocos', () => {
    const candidate = { startAt: d(9), endAt: d(11) }
    expect(hasConflict(candidate, [], teamId)).toBe(false)
  })

  it('detecta sobreposição parcial (candidato começa antes e termina durante o bloco)', () => {
    const blocks = [{ startAt: d(10), endAt: d(12), teamId }]
    const candidate = { startAt: d(9), endAt: d(11) }
    expect(hasConflict(candidate, blocks, teamId)).toBe(true)
  })

  it('detecta sobreposição parcial (candidato começa durante e termina depois do bloco)', () => {
    const blocks = [{ startAt: d(9), endAt: d(11), teamId }]
    const candidate = { startAt: d(10), endAt: d(12) }
    expect(hasConflict(candidate, blocks, teamId)).toBe(true)
  })

  it('detecta quando candidato está contido dentro de um bloco', () => {
    const blocks = [{ startAt: d(9), endAt: d(13), teamId }]
    const candidate = { startAt: d(10), endAt: d(12) }
    expect(hasConflict(candidate, blocks, teamId)).toBe(true)
  })

  it('detecta quando candidato contém o bloco inteiro', () => {
    const blocks = [{ startAt: d(10), endAt: d(11), teamId }]
    const candidate = { startAt: d(9), endAt: d(13) }
    expect(hasConflict(candidate, blocks, teamId)).toBe(true)
  })

  it('retorna false para slots adjacentes (sem sobreposição)', () => {
    const blocks = [{ startAt: d(9), endAt: d(11), teamId }]
    const candidate = { startAt: d(11), endAt: d(13) }
    expect(hasConflict(candidate, blocks, teamId)).toBe(false)
  })

  it('ignora blocos de outros times', () => {
    const blocks = [{ startAt: d(9), endAt: d(13), teamId: 'team-2' }]
    const candidate = { startAt: d(10), endAt: d(12) }
    expect(hasConflict(candidate, blocks, teamId)).toBe(false)
  })

  it('ignora blocos sem teamId', () => {
    const blocks = [{ startAt: d(9), endAt: d(13), teamId: null }]
    const candidate = { startAt: d(10), endAt: d(12) }
    expect(hasConflict(candidate, blocks, teamId)).toBe(false)
  })
})
