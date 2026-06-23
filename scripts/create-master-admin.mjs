import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const bcrypt  = require('bcryptjs')

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
const adapter = new PrismaPg({ connectionString })
const prisma  = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('nil814484', 12)

  const tenant = await prisma.tenant.findFirst({
    where:   { status: { in: ['ACTIVE', 'TRIAL'] } },
    orderBy: { createdAt: 'asc' },
  })

  if (!tenant) {
    console.error('❌ Nenhum tenant encontrado no banco!')
    process.exit(1)
  }

  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`)

  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'nilton@exper-funds.com' } },
    update: {
      hashedPassword,
      isPlatformAdmin: true,
      role: 'ADMIN',
      name: 'Nilton — Master Admin',
    },
    create: {
      email:           'nilton@exper-funds.com',
      name:            'Nilton — Master Admin',
      hashedPassword,
      role:            'ADMIN',
      isPlatformAdmin: true,
      tenantId:        tenant.id,
    },
  })

  console.log(`✅ Usuário master pronto: ${user.email} | isPlatformAdmin: ${user.isPlatformAdmin}`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
