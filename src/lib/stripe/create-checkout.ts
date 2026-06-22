import { getStripe } from './client'
import { format } from 'date-fns'
import { toEt } from '@/lib/scheduling/timezone'

interface CreateCheckoutInput {
  bookingId:          string
  price:              number
  propertyNickname:   string
  userEmail:          string
  scheduledAt:        Date
  /** ID da conta Stripe Connect do tenant (ex: acct_xxx). Opcional — sem ela não há repasse. */
  stripeAccountId?:   string
  /** Taxa da plataforma em percentual (0-100). Default: PLATFORM_FEE_PERCENT env. */
  platformFeePercent?: number
  /**
   * Quando true, usa capture_method = 'manual': reserva o valor no cartão do cliente
   * mas NÃO cobra até a limpeza ser concluída (admin faz capture via /api/admin/bookings/[id]/capture).
   * Prática comum no mercado americano para evitar estornos.
   */
  useHoldCapture?: boolean
}

interface CheckoutResult {
  sessionId: string
  url:       string
}

export async function createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult> {
  const {
    bookingId,
    price,
    propertyNickname,
    userEmail,
    scheduledAt,
    stripeAccountId,
    platformFeePercent,
    useHoldCapture = false,
  } = input

  const stripe = getStripe()
  const scheduledEt    = toEt(scheduledAt)
  const formattedDate  = format(scheduledEt, "dd/MM/yyyy 'às' HH:mm")
  const amountCents    = Math.round(price * 100)

  // Calcula taxa da plataforma (em centavos)
  const feePercent     = platformFeePercent ?? Number(process.env.PLATFORM_FEE_PERCENT ?? 10)
  const feeCents       = stripeAccountId
    ? Math.round(amountCents * (feePercent / 100))
    : 0

  const baseParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: userEmail,
    metadata: { bookingId },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: `House Cleaning — ${propertyNickname}`,
            description: `Scheduled for ${formattedDate} (FL Time)`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL}/booking/cancelled`,
  }

  // Hold/capture: reserva o valor sem cobrar imediatamente
  // Permite capturar manualmente após a limpeza ser concluída
  const paymentIntentData: Record<string, unknown> = useHoldCapture
    ? { capture_method: 'manual' }
    : {}

  // Com Stripe Connect: repassa para a conta do tenant
  if (stripeAccountId) {
    paymentIntentData.application_fee_amount = feeCents
    paymentIntentData.transfer_data = { destination: stripeAccountId }
  }

  if (Object.keys(paymentIntentData).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (baseParams as any).payment_intent_data = paymentIntentData
  }

  const session = await stripe.checkout.sessions.create(
    baseParams,
    { idempotencyKey: bookingId },
  )

  if (!session.url) throw new Error('Stripe did not return a checkout URL')

  return { sessionId: session.id, url: session.url }
}
