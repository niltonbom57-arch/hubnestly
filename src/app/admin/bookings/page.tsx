export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db/prisma'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatEt } from '@/lib/scheduling/timezone'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

export default async function AdminBookingsPage() {
  // Página de plataforma: busca todos os bookings cross-tenant
  const bookings = await prisma.booking.findMany({
    orderBy: { scheduledAt: 'desc' },
    select: {
      id: true, price: true, status: true, scheduledAt: true,
      property: { select: { nickname: true, city: true } },
      user: { select: { name: true } },
      tenant: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Todos os agendamentos</h1>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imóvel</TableHead>
              <TableHead>Data e hora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <p className="font-medium">{b.property?.nickname ?? '-'}</p>
                  <p className="text-xs text-gray-500">{b.property?.city}</p>
                </TableCell>
                <TableCell className="text-sm">{formatEt(b.scheduledAt, 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell><Badge variant="outline">{STATUS_LABELS[b.status] ?? b.status}</Badge></TableCell>
                <TableCell className="font-medium">${Number(b.price).toFixed(2)}</TableCell>
                <TableCell className="text-sm text-gray-600">{b.user?.name ?? '-'}</TableCell>
                <TableCell className="text-sm text-slate-500">{b.tenant?.name ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
