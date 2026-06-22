export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({ orderBy: { createdAt: 'asc' } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Times de limpeza</h1>
      </div>
      <div className="grid gap-4">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
              <div>
                <p className="font-semibold">{team.name}</p>
              </div>
              <Badge variant={team.isActive ? 'default' : 'secondary'} className="ml-auto">
                {team.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {teams.length === 0 && <p className="text-gray-500">Nenhum time cadastrado.</p>}
      </div>
    </div>
  )
}
