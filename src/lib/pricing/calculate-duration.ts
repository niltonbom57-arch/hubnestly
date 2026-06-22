import { DURATION } from './constants'

export interface DurationInput {
  bedrooms:    number
  bathrooms:   number
  livingRooms?: number
  diningRooms?: number
  kitchens?:   number
  offices?:    number
  garages?:    number
  extraRooms?: number // legado
}

export interface DurationConfig {
  baseDurationMinutes?:     number
  durationPerBedroom?:      number
  durationPerBathroom?:     number
  durationPerLivingRoom?:   number
  durationPerDiningRoom?:   number
  durationPerKitchen?:      number
  durationPerOffice?:       number
  durationPerGarage?:       number
}

export function calculateDuration(input: DurationInput, config?: DurationConfig): number {
  const d = {
    base:       config?.baseDurationMinutes    ?? DURATION.BASE_MINUTES,
    perBed:     config?.durationPerBedroom     ?? DURATION.PER_BEDROOM_MINUTES,
    perBath:    config?.durationPerBathroom    ?? DURATION.PER_BATHROOM_MINUTES,
    perLiving:  config?.durationPerLivingRoom  ?? DURATION.PER_LIVING_ROOM_MINUTES,
    perDining:  config?.durationPerDiningRoom  ?? DURATION.PER_DINING_ROOM_MINUTES,
    perKitchen: config?.durationPerKitchen     ?? DURATION.PER_KITCHEN_MINUTES,
    perOffice:  config?.durationPerOffice      ?? DURATION.PER_OFFICE_MINUTES,
    perGarage:  config?.durationPerGarage      ?? DURATION.PER_GARAGE_MINUTES,
  }

  return (
    d.base +
    input.bedrooms  * d.perBed  +
    input.bathrooms * d.perBath +
    (input.livingRooms ?? 1)                       * d.perLiving +
    (input.diningRooms ?? 0)                       * d.perDining +
    (input.kitchens    ?? 1)                       * d.perKitchen +
    (input.offices     ?? input.extraRooms ?? 0)   * d.perOffice +
    (input.garages     ?? 0)                       * d.perGarage
  )
}
