import { z } from 'zod'

export const PROPERTY_CITIES = [
  'Fort Myers',
  'Naples',
  'Bonita Springs',
  'Lehigh Acres',
  'Cape Coral',
  'Marco Island',
] as const

export const propertySchema = z.object({
  nickname: z.string().min(1, 'Nome é obrigatório'),
  address:  z.string().min(5, 'Endereço é obrigatório'),
  city:     z.string().min(1, 'Cidade é obrigatória'),

  // Cômodos com quantidade
  bedrooms:    z.number().int().min(1).max(20),
  bathrooms:   z.number().int().min(1).max(20),
  livingRooms: z.number().int().min(0).max(10),
  diningRooms: z.number().int().min(0).max(10),
  kitchens:    z.number().int().min(0).max(5),
  offices:     z.number().int().min(0).max(10),
  garages:     z.number().int().min(0).max(10),

  // Áreas extras (toggle)
  hasLaundry:  z.boolean(),
  hasPool:     z.boolean(),
  hasPatio:    z.boolean(),
  hasBalcony:  z.boolean(),
  hasBasement: z.boolean(),
  hasAttic:    z.boolean(),
  hasGym:      z.boolean(),
  hasGameRoom: z.boolean(),

  // Legado (mantido para compatibilidade)
  extraRooms: z.number().int().min(0).max(10),
  hasGarage:  z.boolean(),

  // Tipo de imóvel
  propertyType:  z.enum(['house', 'apartment', 'condo', 'office']).default('house'),

  // Acesso ao imóvel
  accessType:    z.enum(['client_present', 'lockbox', 'gate_code', 'key_hidden', 'doorman', 'other']).default('client_present'),
  accessCode:    z.string().max(100).optional().nullable(),
  accessNotes:   z.string().max(500).optional().nullable(),
  cleaningNotes: z.string().max(500).optional().nullable(),
  cleaningAreas: z.array(z.string()).optional().default([]),
})

export type PropertyInput = z.infer<typeof propertySchema>
