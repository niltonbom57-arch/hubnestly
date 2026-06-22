-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_multi_tenant
-- Estratégia de backfill seguro:
--   1. Cria enums e tabelas novas (Tenant, TenantSettings)
--   2. Adiciona tenantId como NULLABLE em todas as tabelas existentes
--   3. Insere o tenant legado "cleanbookfl" e faz backfill de todos os registros
--   4. Altera tenantId para NOT NULL
--   5. Adiciona constraints e índices
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Enums novos
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "TenantPlan"   AS ENUM ('STARTER', 'PRO', 'SCALE');

-- 2. Tabela Tenant
CREATE TABLE "Tenant" (
    "id"                   TEXT NOT NULL,
    "slug"                 TEXT NOT NULL,
    "name"                 TEXT NOT NULL,
    "subdomain"            TEXT,
    "customDomain"         TEXT,
    "status"               "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "plan"                 "TenantPlan"   NOT NULL DEFAULT 'STARTER',
    "stripeCustomerId"     TEXT,
    "stripeSubscriptionId" TEXT,
    "trialEndsAt"          TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key"                 ON "Tenant"("slug");
CREATE UNIQUE INDEX "Tenant_subdomain_key"            ON "Tenant"("subdomain");
CREATE UNIQUE INDEX "Tenant_customDomain_key"         ON "Tenant"("customDomain");
CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key"     ON "Tenant"("stripeCustomerId");
CREATE UNIQUE INDEX "Tenant_stripeSubscriptionId_key" ON "Tenant"("stripeSubscriptionId");
CREATE INDEX        "Tenant_status_idx"               ON "Tenant"("status");
CREATE INDEX        "Tenant_slug_idx"                 ON "Tenant"("slug");

-- 3. Tabela TenantSettings
CREATE TABLE "TenantSettings" (
    "id"                    TEXT NOT NULL,
    "tenantId"              TEXT NOT NULL,
    "logoUrl"               TEXT,
    "primaryColor"          TEXT NOT NULL DEFAULT '#0ea5e9',
    "supportEmail"          TEXT,
    "supportPhone"          TEXT,
    "cities"                TEXT[] NOT NULL DEFAULT '{}',
    "timezone"              TEXT NOT NULL DEFAULT 'America/New_York',
    "workDays"              INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],
    "startHour"             INTEGER NOT NULL DEFAULT 8,
    "endHour"               INTEGER NOT NULL DEFAULT 18,
    "minAdvanceHours"       INTEGER NOT NULL DEFAULT 24,
    "travelBlockMinutes"    INTEGER NOT NULL DEFAULT 40,
    "basePrice"             DECIMAL(10,2) NOT NULL DEFAULT 35.00,
    "pricePerBedroom"       DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    "pricePerBathroom"      DECIMAL(10,2) NOT NULL DEFAULT 20.00,
    "priceLaundry"          DECIMAL(10,2) NOT NULL DEFAULT 20.00,
    "priceExtraRoom"        DECIMAL(10,2) NOT NULL DEFAULT 15.00,
    "priceGarage"           DECIMAL(10,2) NOT NULL DEFAULT 30.00,
    "pricePool"             DECIMAL(10,2) NOT NULL DEFAULT 35.00,
    "pricePatio"            DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    "baseDurationMinutes"   INTEGER NOT NULL DEFAULT 90,
    "durationPerBedroom"    INTEGER NOT NULL DEFAULT 30,
    "durationPerBathroom"   INTEGER NOT NULL DEFAULT 20,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantSettings_pkey"         PRIMARY KEY ("id"),
    CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

-- 4. Inserir tenant legado
INSERT INTO "Tenant" ("id", "slug", "name", "status", "plan", "createdAt", "updatedAt")
VALUES (
    'legacy-cleanbookfl',
    'cleanbookfl',
    'CleanBookFL',
    'ACTIVE',
    'SCALE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "TenantSettings" ("id", "tenantId", "cities", "updatedAt")
VALUES (
    'legacy-settings',
    'legacy-cleanbookfl',
    ARRAY['Fort Myers', 'Naples', 'Bonita Springs', 'Lehigh Acres'],
    CURRENT_TIMESTAMP
);

-- 5. Adicionar tenantId como nullable (passo 1 do backfill)
ALTER TABLE "User"      ADD COLUMN "tenantId"        TEXT;
ALTER TABLE "User"      ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Property"  ADD COLUMN "tenantId"        TEXT;
ALTER TABLE "Team"      ADD COLUMN "tenantId"        TEXT;
ALTER TABLE "Booking"   ADD COLUMN "tenantId"        TEXT;
ALTER TABLE "TimeBlock" ADD COLUMN "tenantId"        TEXT;

-- 6. Backfill — todos os registros existentes vão para o tenant legado
UPDATE "User"      SET "tenantId" = 'legacy-cleanbookfl';
UPDATE "Property"  SET "tenantId" = 'legacy-cleanbookfl';
UPDATE "Team"      SET "tenantId" = 'legacy-cleanbookfl';
UPDATE "Booking"   SET "tenantId" = 'legacy-cleanbookfl';
UPDATE "TimeBlock" SET "tenantId" = 'legacy-cleanbookfl';

-- 7. Tornar tenantId NOT NULL após backfill
ALTER TABLE "User"      ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Property"  ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Team"      ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Booking"   ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "TimeBlock" ALTER COLUMN "tenantId" SET NOT NULL;

-- 8. Remover unique antigo de email (era global, agora é por tenant)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";

-- 9. Foreign keys
ALTER TABLE "User"      ADD CONSTRAINT "User_tenantId_fkey"      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Property"  ADD CONSTRAINT "Property_tenantId_fkey"  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Team"      ADD CONSTRAINT "Team_tenantId_fkey"      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking"   ADD CONSTRAINT "Booking_tenantId_fkey"   FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Unique composto email por tenant
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- 11. Índices compostos de performance
CREATE INDEX "User_tenantId_idx"                   ON "User"("tenantId");
CREATE INDEX "Property_tenantId_idx"               ON "Property"("tenantId");
CREATE INDEX "Property_tenantId_userId_idx"        ON "Property"("tenantId", "userId");
CREATE INDEX "Team_tenantId_idx"                   ON "Team"("tenantId");
CREATE INDEX "Team_tenantId_isActive_idx"          ON "Team"("tenantId", "isActive");
CREATE INDEX "Booking_tenantId_idx"                ON "Booking"("tenantId");
CREATE INDEX "Booking_tenantId_scheduledAt_idx"    ON "Booking"("tenantId", "scheduledAt");
CREATE INDEX "Booking_tenantId_status_idx"         ON "Booking"("tenantId", "status");
CREATE INDEX "TimeBlock_tenantId_idx"              ON "TimeBlock"("tenantId");
CREATE INDEX "TimeBlock_tenantId_teamId_range_idx" ON "TimeBlock"("tenantId", "teamId", "startAt", "endAt");
