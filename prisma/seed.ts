import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { addDays, setHours, setMinutes } from 'date-fns'

if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed não pode rodar em produção')
}

const connectionString = process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'] ?? ''
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const LEGACY_TENANT_ID = 'legacy-cleanbookfl'

async function main() {
  console.log('🌱 Iniciando seed...')

  // Garante que o tenant legado existe
  await prisma.tenant.upsert({
    where: { id: LEGACY_TENANT_ID },
    update: {},
    create: {
      id: LEGACY_TENANT_ID,
      slug: 'cleanbookfl',
      name: 'CleanBookFL',
      status: 'ACTIVE',
      plan: 'SCALE',
    },
  })

  await prisma.tenantSettings.upsert({
    where: { tenantId: LEGACY_TENANT_ID },
    update: {},
    create: {
      id: 'legacy-settings',
      tenantId: LEGACY_TENANT_ID,
      cities: ['Fort Myers', 'Naples', 'Bonita Springs', 'Lehigh Acres'],
    },
  })

  // Admin
  const adminPassword = await bcrypt.hash('admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: LEGACY_TENANT_ID, email: 'admin@cleanbookfl.com' } },
    update: {},
    create: {
      tenantId: LEGACY_TENANT_ID,
      name: 'Admin CleanBookFL',
      email: 'admin@cleanbookfl.com',
      hashedPassword: adminPassword,
      role: 'ADMIN',
      isPlatformAdmin: true,
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  // Times
  const [team1, team2] = await Promise.all([
    prisma.team.upsert({
      where: { id: 'cm0000000000team0001' },
      update: {},
      create: { id: 'cm0000000000team0001', tenantId: LEGACY_TENANT_ID, name: 'Time Azul', color: '#3B82F6' },
    }),
    prisma.team.upsert({
      where: { id: 'cm0000000000team0002' },
      update: {},
      create: { id: 'cm0000000000team0002', tenantId: LEGACY_TENANT_ID, name: 'Time Verde', color: '#10B981' },
    }),
  ])
  console.log(`✅ Times: ${team1.name}, ${team2.name}`)

  // Clientes
  const clientPassword = await bcrypt.hash('cliente123!', 12)
  const clientsData = [
    { id: 'client-1', name: 'Maria Santos',   email: 'maria@exemplo.com',    phone: '(239) 555-0101' },
    { id: 'client-2', name: 'John Davis',     email: 'john@exemplo.com',     phone: '(239) 555-0102' },
    { id: 'client-3', name: 'Ana Rodriguez',  email: 'ana@exemplo.com',      phone: '(239) 555-0103' },
    { id: 'client-4', name: 'Roberto Lima',   email: 'roberto@exemplo.com',  phone: '(239) 555-0104' },
    { id: 'client-5', name: 'Sarah Johnson',  email: 'sarah@exemplo.com',    phone: '(239) 555-0105' },
  ]

  const clients = await Promise.all(
    clientsData.map((c) =>
      prisma.user.upsert({
        where: { tenantId_email: { tenantId: LEGACY_TENANT_ID, email: c.email } },
        update: {},
        create: { ...c, tenantId: LEGACY_TENANT_ID, hashedPassword: clientPassword, role: 'CLIENT' },
      }),
    ),
  )
  console.log(`✅ ${clients.length} clientes criados`)

  // Imóveis
  const propertiesData = [
    { id: 'prop-1', userId: clients[0]!.id, nickname: 'Casa em Naples',       address: '1234 Palm Ave',         city: 'Naples',        bedrooms: 3, bathrooms: 2, hasLaundry: true,  extraRooms: 0, hasGarage: false, hasPool: true,  hasPatio: false, calculatedPrice: 220 },
    { id: 'prop-2', userId: clients[1]!.id, nickname: 'Apt Fort Myers',       address: '567 Gulf Shore Dr',     city: 'Fort Myers',    bedrooms: 2, bathrooms: 1, hasLaundry: false, extraRooms: 0, hasGarage: false, hasPool: false, hasPatio: false, calculatedPrice: 115 },
    { id: 'prop-3', userId: clients[2]!.id, nickname: 'Casa Bonita Springs',  address: '890 Bonita Beach Rd',   city: 'Bonita Springs',bedrooms: 4, bathrooms: 3, hasLaundry: true,  extraRooms: 1, hasGarage: true,  hasPool: false, hasPatio: true,  calculatedPrice: 310 },
    { id: 'prop-4', userId: clients[3]!.id, nickname: 'Casa Lehigh',          address: '2222 Lee Blvd',         city: 'Lehigh Acres',  bedrooms: 3, bathrooms: 2, hasLaundry: false, extraRooms: 0, hasGarage: true,  hasPool: false, hasPatio: true,  calculatedPrice: 205 },
    { id: 'prop-5', userId: clients[4]!.id, nickname: 'Villa Naples',         address: '4321 Vanderbilt Dr',    city: 'Naples',        bedrooms: 5, bathrooms: 4, hasLaundry: true,  extraRooms: 2, hasGarage: true,  hasPool: true,  hasPatio: true,  calculatedPrice: 430 },
  ]

  const properties = await Promise.all(
    propertiesData.map((p) =>
      prisma.property.upsert({
        where: { id: p.id },
        update: {},
        create: { ...p, tenantId: LEGACY_TENANT_ID },
      }),
    ),
  )
  console.log(`✅ ${properties.length} imóveis criados`)

  // Agendamentos
  const now = new Date()
  function bookingDate(daysFromNow: number, hour: number): Date {
    return setMinutes(setHours(addDays(now, daysFromNow), hour), 0)
  }

  const bookingsData = [
    { id: 'booking-1',  userId: clients[0]!.id, propertyId: 'prop-1', teamId: team1.id, scheduledAt: bookingDate(2,   9), estimatedDuration: 220, price: 220, status: 'CONFIRMED' as const },
    { id: 'booking-2',  userId: clients[1]!.id, propertyId: 'prop-2', teamId: team2.id, scheduledAt: bookingDate(3,  10), estimatedDuration: 160, price: 115, status: 'CONFIRMED' as const },
    { id: 'booking-3',  userId: clients[2]!.id, propertyId: 'prop-3', teamId: team1.id, scheduledAt: bookingDate(5,   8), estimatedDuration: 280, price: 310, status: 'CONFIRMED' as const },
    { id: 'booking-4',  userId: clients[3]!.id, propertyId: 'prop-4', teamId: team2.id, scheduledAt: bookingDate(7,   9), estimatedDuration: 220, price: 205, status: 'PENDING'   as const },
    { id: 'booking-5',  userId: clients[4]!.id, propertyId: 'prop-5', teamId: team1.id, scheduledAt: bookingDate(10,  8), estimatedDuration: 330, price: 430, status: 'CONFIRMED' as const },
    { id: 'booking-6',  userId: clients[0]!.id, propertyId: 'prop-1', teamId: team1.id, scheduledAt: bookingDate(-14, 9), estimatedDuration: 220, price: 220, status: 'COMPLETED' as const },
    { id: 'booking-7',  userId: clients[1]!.id, propertyId: 'prop-2', teamId: team2.id, scheduledAt: bookingDate(-7, 10), estimatedDuration: 160, price: 115, status: 'COMPLETED' as const },
    { id: 'booking-8',  userId: clients[2]!.id, propertyId: 'prop-3', teamId: team1.id, scheduledAt: bookingDate(-3,  8), estimatedDuration: 280, price: 310, status: 'COMPLETED' as const },
    { id: 'booking-9',  userId: clients[3]!.id, propertyId: 'prop-4', teamId: team2.id, scheduledAt: bookingDate(-1,  9), estimatedDuration: 220, price: 205, status: 'CANCELLED' as const },
    { id: 'booking-10', userId: clients[4]!.id, propertyId: 'prop-5', teamId: team1.id, scheduledAt: bookingDate(-30, 8), estimatedDuration: 330, price: 430, status: 'COMPLETED' as const },
  ]

  await Promise.all(
    bookingsData.map((b) =>
      prisma.booking.upsert({
        where: { id: b.id },
        update: {},
        create: { ...b, tenantId: LEGACY_TENANT_ID },
      }),
    ),
  )
  console.log(`✅ 10 agendamentos criados`)

  // Serviços adicionais
  const addOnsData = [
    { id: 'addon-fridge',   name: 'Limpeza interna da geladeira',      description: 'Limpeza completa por dentro da geladeira, incluindo prateleiras e gavetas.',       price: 45, durationMinutes: 30, icon: '🧊', category: 'kitchen',  sortOrder: 1 },
    { id: 'addon-oven',     name: 'Limpeza interna do forno',           description: 'Remoção de gordura e resíduos do interior do forno, incluindo grades.',             price: 40, durationMinutes: 25, icon: '🔥', category: 'kitchen',  sortOrder: 2 },
    { id: 'addon-cabinets', name: 'Limpeza de gabinetes e despensa',    description: 'Limpeza interna de armários de cozinha, despensa e organização básica.',           price: 35, durationMinutes: 25, icon: '🗄️', category: 'kitchen',  sortOrder: 3 },
    { id: 'addon-garage',   name: 'Limpeza profunda da garagem',        description: 'Varrição, limpeza do piso e organização geral da garagem.',                        price: 55, durationMinutes: 45, icon: '🏠', category: 'garage',   sortOrder: 4 },
    { id: 'addon-glass',    name: 'Limpeza de portas e janelas de vidro',description: 'Limpeza de todas as portas de vidro, janelas e espelhos da residência.',          price: 30, durationMinutes: 20, icon: '🪟', category: 'glass',    sortOrder: 5 },
    { id: 'addon-outdoor',  name: 'Limpeza de área externa e varanda',  description: 'Limpeza de varandas, terraços, área da piscina e mobiliário externo.',            price: 35, durationMinutes: 30, icon: '🌿', category: 'outdoor',  sortOrder: 6 },
  ]

  await Promise.all(
    addOnsData.map((a) =>
      prisma.addOn.upsert({
        where: { id: a.id },
        update: { price: a.price, durationMinutes: a.durationMinutes },
        create: { ...a, tenantId: LEGACY_TENANT_ID },
      }),
    ),
  )
  console.log(`✅ ${addOnsData.length} serviços adicionais criados`)

  console.log('\n🎉 Seed concluído!')
  console.log('📧 Admin: admin@cleanbookfl.com / Senha: admin123!')
  console.log('📧 Clientes: [nome]@exemplo.com / Senha: cliente123!')
  console.log(`🏢 Painel: /t/cleanbookfl/admin`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
