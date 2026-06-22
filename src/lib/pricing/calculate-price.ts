import { PRICING } from './constants'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PriceInput {
  // Cômodos com quantidade
  bedrooms:    number
  bathrooms:   number
  livingRooms?: number
  diningRooms?: number
  kitchens?:   number
  offices?:    number
  garages?:    number
  // Áreas extras (toggle)
  hasLaundry:  boolean
  hasPool:     boolean
  hasPatio:    boolean
  hasBalcony?: boolean
  hasBasement?: boolean
  hasAttic?:   boolean
  hasGym?:     boolean
  hasGameRoom?: boolean
  // Legado
  extraRooms?: number
  hasGarage?:  boolean
}

export interface PriceBreakdown {
  base:        number
  bedrooms:    number
  bathrooms:   number
  livingRooms: number
  diningRooms: number
  kitchens:    number
  offices:     number
  garages:     number
  laundry:     number
  pool:        number
  patio:       number
  balcony:     number
  basement:    number
  attic:       number
  gym:         number
  gameRoom:    number
  total:       number
}

export interface PriceConfig {
  basePrice?:          number
  pricePerBedroom?:    number
  pricePerBathroom?:   number
  pricePerLivingRoom?: number
  pricePerDiningRoom?: number
  pricePerKitchen?:    number
  pricePerOffice?:     number
  pricePerGarage?:     number
  priceLaundry?:       number
  pricePool?:          number
  pricePatio?:         number
  priceBalcony?:       number
  priceBasement?:      number
  priceAttic?:         number
  priceGym?:           number
  priceGameRoom?:      number
  // Legado
  priceExtraRoom?:     number
  priceGarage?:        number
}

// ─── Função principal ─────────────────────────────────────────────────────────

export function calculatePrice(input: PriceInput, config?: PriceConfig): PriceBreakdown {
  const p = {
    base:        n(config?.basePrice)          ?? PRICING.BASE,
    perBed:      n(config?.pricePerBedroom)    ?? PRICING.PER_BEDROOM,
    perBath:     n(config?.pricePerBathroom)   ?? PRICING.PER_BATHROOM,
    perLiving:   n(config?.pricePerLivingRoom) ?? PRICING.PER_LIVING_ROOM,
    perDining:   n(config?.pricePerDiningRoom) ?? PRICING.PER_DINING_ROOM,
    perKitchen:  n(config?.pricePerKitchen)    ?? PRICING.PER_KITCHEN,
    perOffice:   n(config?.pricePerOffice)     ?? PRICING.PER_OFFICE,
    perGarage:   n(config?.pricePerGarage)     ?? PRICING.PER_GARAGE,
    laundry:     n(config?.priceLaundry)       ?? PRICING.LAUNDRY,
    pool:        n(config?.pricePool)          ?? PRICING.POOL,
    patio:       n(config?.pricePatio)         ?? PRICING.PATIO,
    balcony:     n(config?.priceBalcony)       ?? PRICING.BALCONY,
    basement:    n(config?.priceBasement)      ?? PRICING.BASEMENT,
    attic:       n(config?.priceAttic)         ?? PRICING.ATTIC,
    gym:         n(config?.priceGym)           ?? PRICING.GYM,
    gameRoom:    n(config?.priceGameRoom)      ?? PRICING.GAME_ROOM,
  }

  const bedrooms    = input.bedrooms    * p.perBed
  const bathrooms   = input.bathrooms   * p.perBath
  const livingRooms = (input.livingRooms ?? 1) * p.perLiving
  const diningRooms = (input.diningRooms ?? 0) * p.perDining
  const kitchens    = (input.kitchens   ?? 1) * p.perKitchen
  const offices     = (input.offices    ?? input.extraRooms ?? 0) * p.perOffice
  const garages     = (input.garages    ?? (input.hasGarage ? 1 : 0)) * p.perGarage

  const laundry  = input.hasLaundry  ? p.laundry  : 0
  const pool     = input.hasPool     ? p.pool     : 0
  const patio    = input.hasPatio    ? p.patio    : 0
  const balcony  = input.hasBalcony  ? p.balcony  : 0
  const basement = input.hasBasement ? p.basement : 0
  const attic    = input.hasAttic    ? p.attic    : 0
  const gym      = input.hasGym      ? p.gym      : 0
  const gameRoom = input.hasGameRoom ? p.gameRoom : 0

  const total = p.base + bedrooms + bathrooms + livingRooms + diningRooms +
    kitchens + offices + garages + laundry + pool + patio +
    balcony + basement + attic + gym + gameRoom

  return {
    base: p.base,
    bedrooms, bathrooms, livingRooms, diningRooms,
    kitchens, offices, garages,
    laundry, pool, patio, balcony, basement, attic, gym, gameRoom,
    total,
  }
}

/** Converte Decimal do Prisma ou number para number */
function n(val: unknown): number | undefined {
  if (val == null) return undefined
  const num = Number(val)
  return isNaN(num) ? undefined : num
}
