import { calculatePrice } from '@/lib/pricing/calculate-price'

const base = { hasLaundry: false, extraRooms: 0, hasGarage: false, hasPool: false, hasPatio: false }

describe('calculatePrice', () => {
  it('3 quartos + 2 banheiros = $150 exatamente (regra crítica do negócio)', () => {
    const result = calculatePrice({ bedrooms: 3, bathrooms: 2, ...base })
    expect(result.total).toBe(150)
  })

  it('retorna base $35 para casa mínima (1 quarto, 1 banheiro)', () => {
    const result = calculatePrice({ bedrooms: 1, bathrooms: 1, ...base })
    expect(result.total).toBe(35 + 25 + 20)
    expect(result.total).toBe(80)
  })

  it('calcula corretamente cada quarto (+$25)', () => {
    const r1 = calculatePrice({ bedrooms: 1, bathrooms: 0, ...base })
    const r2 = calculatePrice({ bedrooms: 2, bathrooms: 0, ...base })
    expect(r2.total - r1.total).toBe(25)
  })

  it('calcula corretamente cada banheiro (+$20)', () => {
    const r1 = calculatePrice({ bedrooms: 0, bathrooms: 1, ...base })
    const r2 = calculatePrice({ bedrooms: 0, bathrooms: 2, ...base })
    expect(r2.total - r1.total).toBe(20)
  })

  it('inclui lavanderia (+$20)', () => {
    const sem = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base })
    const com = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base, hasLaundry: true })
    expect(com.total - sem.total).toBe(20)
  })

  it('inclui cada sala extra (+$15)', () => {
    const sem = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base })
    const com = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base, extraRooms: 2 })
    expect(com.total - sem.total).toBe(30)
  })

  it('inclui garagem (+$30)', () => {
    const sem = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base })
    const com = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base, hasGarage: true })
    expect(com.total - sem.total).toBe(30)
  })

  it('inclui piscina (+$35)', () => {
    const sem = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base })
    const com = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base, hasPool: true })
    expect(com.total - sem.total).toBe(35)
  })

  it('inclui pátio (+$25)', () => {
    const sem = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base })
    const com = calculatePrice({ bedrooms: 2, bathrooms: 1, ...base, hasPatio: true })
    expect(com.total - sem.total).toBe(25)
  })

  it('calcula casa completa com todos os extras', () => {
    const result = calculatePrice({
      bedrooms: 4,
      bathrooms: 3,
      hasLaundry: true,
      extraRooms: 2,
      hasGarage: true,
      hasPool: true,
      hasPatio: true,
    })
    // 35 + (4×25) + (3×20) + 20 + (2×15) + 30 + 35 + 25
    // 35 + 100 + 60 + 20 + 30 + 30 + 35 + 25 = 335
    expect(result.total).toBe(335)
  })

  it('retorna breakdown correto', () => {
    const result = calculatePrice({ bedrooms: 3, bathrooms: 2, ...base })
    expect(result.base).toBe(35)
    expect(result.bedrooms).toBe(75)
    expect(result.bathrooms).toBe(40)
    expect(result.laundry).toBe(0)
    expect(result.offices).toBe(0)
    expect(result.garages).toBe(0)
    expect(result.pool).toBe(0)
    expect(result.patio).toBe(0)
  })
})
