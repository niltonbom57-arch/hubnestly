import { z } from 'zod'

export const onboardingSchema = z.object({
  // Passo 1 — Empresa
  companyName: z.string().min(2, 'Nome da empresa obrigatório'),
  slug: z
    .string()
    .min(2, 'Slug muito curto')
    .max(30, 'Slug muito longo')
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  // Passo 2 — Admin da empresa
  adminName: z.string().min(2, 'Seu nome é obrigatório'),
  adminEmail: z.string().email('Email inválido'),
  adminPassword: z.string().min(8, 'Senha mínima de 8 caracteres'),
  // Passo 3 — Operação
  cities: z.array(z.string()).min(1, 'Selecione ao menos uma cidade'),
  timezone: z.string(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
