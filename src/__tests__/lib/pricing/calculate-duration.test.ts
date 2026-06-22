import { calculateDuration } from '@/lib/pricing/calculate-duration'

describe('calculateDuration', () => {
  it('base é 90 minutos para 0 quartos e 0 banheiros', () => {
    expect(calculateDuration({ bedrooms: 0, bathrooms: 0 })).toBe(90)
  })

  it('adiciona 30 minutos por quarto', () => {
    expect(calculateDuration({ bedrooms: 1, bathrooms: 0 })).toBe(120)
    expect(calculateDuration({ bedrooms: 2, bathrooms: 0 })).toBe(150)
    expect(calculateDuration({ bedrooms: 3, bathrooms: 0 })).toBe(180)
  })

  it('adiciona 20 minutos por banheiro', () => {
    expect(calculateDuration({ bedrooms: 0, bathrooms: 1 })).toBe(110)
    expect(calculateDuration({ bedrooms: 0, bathrooms: 2 })).toBe(130)
  })

  it('3 quartos + 2 banheiros = 180 minutos (3h)', () => {
    expect(calculateDuration({ bedrooms: 3, bathrooms: 2 })).toBe(90 + 90 + 40)
    expect(calculateDuration({ bedrooms: 3, bathrooms: 2 })).toBe(220)
  })

  it('casa grande: 5 quartos + 4 banheiros', () => {
    // 90 + (5×30) + (4×20) = 90 + 150 + 80 = 320
    expect(calculateDuration({ bedrooms: 5, bathrooms: 4 })).toBe(320)
  })
})
