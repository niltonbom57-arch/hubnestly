// ─── Preços padrão (override via TenantSettings) ─────────────────────────────
export const PRICING = {
  BASE: 35,
  // Cômodos com quantidade
  PER_BEDROOM:    25,
  PER_BATHROOM:   20,
  PER_LIVING_ROOM: 15,
  PER_DINING_ROOM: 12,
  PER_KITCHEN:    20,
  PER_OFFICE:     15,
  PER_GARAGE:     30,
  // Áreas extras (toggle)
  LAUNDRY:   20,
  POOL:      35,
  PATIO:     25,
  BALCONY:   15,
  BASEMENT:  30,
  ATTIC:     25,
  GYM:       20,
  GAME_ROOM: 20,
  // Legado
  PER_EXTRA_ROOM: 15,
  GARAGE: 30,
} as const

// ─── Duração padrão em minutos (override via TenantSettings) ─────────────────
export const DURATION = {
  BASE_MINUTES:           90,
  PER_BEDROOM_MINUTES:    30,
  PER_BATHROOM_MINUTES:   20,
  PER_LIVING_ROOM_MINUTES: 15,
  PER_DINING_ROOM_MINUTES: 10,
  PER_KITCHEN_MINUTES:    20,
  PER_OFFICE_MINUTES:     15,
  PER_GARAGE_MINUTES:     20,
} as const

// ─── Agendamento ──────────────────────────────────────────────────────────────
export const SCHEDULING = {
  TRAVEL_BLOCK_MINUTES: 40,
  MIN_ADVANCE_HOURS:    24,
  SLOT_INTERVAL_MINUTES: 30,
  START_HOUR: 8,
  END_HOUR:   18,
} as const
