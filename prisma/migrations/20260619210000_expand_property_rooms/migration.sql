-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: expand_property_rooms
-- Adiciona novos cômodos na tabela Property e novos preços em TenantSettings
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Novos campos em Property (todos com DEFAULT para não quebrar dados existentes)
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "livingRooms" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "diningRooms" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "kitchens"    INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "offices"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "garages"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "hasBalcony"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasBasement" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasAttic"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasGym"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasGameRoom" BOOLEAN NOT NULL DEFAULT false;

-- Migra dados legados: extraRooms → offices, hasGarage → garages (se garages=0)
UPDATE "Property" SET "offices" = "extraRooms"        WHERE "extraRooms" > 0 AND "offices" = 0;
UPDATE "Property" SET "garages" = 1                   WHERE "hasGarage" = true AND "garages" = 0;

-- 2. Novos campos de preço em TenantSettings
ALTER TABLE "TenantSettings"
  ADD COLUMN IF NOT EXISTS "pricePerLivingRoom"   DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS "pricePerDiningRoom"   DECIMAL(10,2) NOT NULL DEFAULT 12.00,
  ADD COLUMN IF NOT EXISTS "pricePerKitchen"      DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS "pricePerOffice"       DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS "pricePerGarage"       DECIMAL(10,2) NOT NULL DEFAULT 30.00,
  ADD COLUMN IF NOT EXISTS "priceBalcony"         DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS "priceBasement"        DECIMAL(10,2) NOT NULL DEFAULT 30.00,
  ADD COLUMN IF NOT EXISTS "priceAttic"           DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  ADD COLUMN IF NOT EXISTS "priceGym"             DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS "priceGameRoom"        DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS "durationPerLivingRoom"  INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS "durationPerDiningRoom"  INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "durationPerKitchen"     INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS "durationPerOffice"      INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS "durationPerGarage"      INTEGER NOT NULL DEFAULT 20;
