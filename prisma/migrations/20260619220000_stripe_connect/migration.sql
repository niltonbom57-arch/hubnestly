-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: stripe_connect
-- Adiciona suporte a Stripe Connect por tenant
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "stripeAccountId"     TEXT,
  ADD COLUMN IF NOT EXISTS "stripeAccountStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "platformFeePercent"  DECIMAL(5,2) NOT NULL DEFAULT 10.00;

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_stripeAccountId_key"
  ON "Tenant"("stripeAccountId");
