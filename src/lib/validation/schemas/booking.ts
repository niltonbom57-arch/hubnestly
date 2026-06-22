import { z } from 'zod'

export const createBookingSchema = z.object({
  propertyId: z.string().cuid(),
  scheduledAt: z.string().datetime(),
  teamId: z.string().min(1).optional(),
  notes: z.string().max(500).optional(),
  addOnIds: z.array(z.string()).optional().default([]),
})

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD'),
  duration: z.string().transform(Number).pipe(z.number().int().min(30).max(600)),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>
