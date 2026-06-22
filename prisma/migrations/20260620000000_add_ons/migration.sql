-- CreateTable AddOn
CREATE TABLE "AddOn" (
    "id"              TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "description"     TEXT,
    "price"           DECIMAL(8,2) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "icon"            TEXT,
    "category"        TEXT NOT NULL DEFAULT 'general',
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable BookingAddOn
CREATE TABLE "BookingAddOn" (
    "id"        TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "addOnId"   TEXT NOT NULL,
    "price"     DECIMAL(8,2) NOT NULL,

    CONSTRAINT "BookingAddOn_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "AddOn_tenantId_isActive_idx" ON "AddOn"("tenantId", "isActive");
CREATE UNIQUE INDEX "BookingAddOn_bookingId_addOnId_key" ON "BookingAddOn"("bookingId", "addOnId");

-- ForeignKeys
ALTER TABLE "AddOn"
    ADD CONSTRAINT "AddOn_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingAddOn"
    ADD CONSTRAINT "BookingAddOn_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingAddOn"
    ADD CONSTRAINT "BookingAddOn_addOnId_fkey"
    FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
