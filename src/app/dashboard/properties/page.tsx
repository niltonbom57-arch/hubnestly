import { auth } from '@/lib/auth/session'
import { findPropertiesByUser } from '@/lib/repositories/property-repository'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Plus, Home, Building2, Building, Briefcase,
  BedDouble, Bath, Waves, Car, Leaf, WashingMachine,
  Dumbbell, Gamepad2, ArrowRight, Key, Lock, KeyRound,
} from 'lucide-react'
import { PropertyActions } from '@/components/dashboard/property-actions'

const PROPERTY_TYPE_ICONS: Record<string, React.ReactNode> = {
  house:     <Home className="w-5 h-5" />,
  apartment: <Building2 className="w-5 h-5" />,
  condo:     <Building className="w-5 h-5" />,
  office:    <Briefcase className="w-5 h-5" />,
}
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house:     'Casa',
  apartment: 'Apartamento',
  condo:     'Condomínio',
  office:    'Escritório',
}
const ACCESS_TYPE_ICONS: Record<string, React.ReactNode> = {
  client_present: <Home className="w-3 h-3" />,
  lockbox:        <Lock className="w-3 h-3" />,
  gate_code:      <KeyRound className="w-3 h-3" />,
  key_hidden:     <Key className="w-3 h-3" />,
  doorman:        <Building2 className="w-3 h-3" />,
  other:          <Key className="w-3 h-3" />,
}
const ACCESS_TYPE_LABELS: Record<string, string> = {
  client_present: 'Estarei presente',
  lockbox:        'Lockbox',
  gate_code:      'Código do portão',
  key_hidden:     'Chave escondida',
  doorman:        'Porteiro',
  other:          'Outro',
}

export default async function PropertiesPage() {
  const session = await auth()
  if (!session) return null

  const properties = await findPropertiesByUser(session.user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Meus imóveis</h1>
          <p className="text-slate-500 text-sm mt-1">
            {properties.length} imóvel{properties.length !== 1 ? 'is' : ''} cadastrado{properties.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold">
          <Link href="/dashboard/properties/new">
            <Plus className="w-4 h-4 mr-2" />Adicionar imóvel
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl py-20 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-teal-400" />
          </div>
          <p className="font-bold text-slate-800 text-lg mb-1">Nenhum imóvel cadastrado</p>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            Adicione sua casa ou apartamento para começar a agendar limpezas.
          </p>
          <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
            <Link href="/dashboard/properties/new">
              <Plus className="w-4 h-4 mr-2" />Adicionar meu primeiro imóvel
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {properties.map((p) => {
            const pType = (p as { propertyType?: string }).propertyType ?? 'house'
            const aType = (p as { accessType?: string }).accessType ?? 'client_present'
            const price = parseFloat(p.calculatedPrice.toString())

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all overflow-hidden">
                {/* Top color bar by type */}
                <div className={`h-1.5 ${pType === 'house' ? 'bg-teal-500' : pType === 'apartment' ? 'bg-blue-500' : pType === 'condo' ? 'bg-violet-500' : 'bg-amber-500'}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        pType === 'house' ? 'bg-teal-50 text-teal-600' :
                        pType === 'apartment' ? 'bg-blue-50 text-blue-600' :
                        pType === 'condo' ? 'bg-violet-50 text-violet-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {PROPERTY_TYPE_ICONS[pType] ?? <Home className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{p.nickname}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{p.address}, {p.city}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-teal-600 text-xl">${price.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">por limpeza</p>
                    </div>
                  </div>

                  {/* Type + Access badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="outline" className="text-xs gap-1 rounded-full border-slate-200">
                      {PROPERTY_TYPE_ICONS[pType]}
                      {PROPERTY_TYPE_LABELS[pType] ?? 'Casa'}
                    </Badge>
                    <Badge variant="outline" className="text-xs gap-1 rounded-full border-slate-200">
                      {ACCESS_TYPE_ICONS[aType]}
                      {ACCESS_TYPE_LABELS[aType] ?? 'Acesso'}
                    </Badge>
                  </div>

                  {/* Room features */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <FeatureChip icon={<BedDouble className="w-3 h-3" />} label={`${p.bedrooms} quarto${p.bedrooms !== 1 ? 's' : ''}`} />
                    <FeatureChip icon={<Bath className="w-3 h-3" />} label={`${p.bathrooms} banheiro${p.bathrooms !== 1 ? 's' : ''}`} />
                    {p.hasLaundry && <FeatureChip icon={<WashingMachine className="w-3 h-3" />} label="Lavanderia" />}
                    {(p.hasGarage || (p.garages ?? 0) > 0) && <FeatureChip icon={<Car className="w-3 h-3" />} label="Garagem" />}
                    {p.hasPool && <FeatureChip icon={<Waves className="w-3 h-3" />} label="Piscina" />}
                    {p.hasPatio && <FeatureChip icon={<Leaf className="w-3 h-3" />} label="Pátio" />}
                    {p.hasBalcony && <FeatureChip icon={<Leaf className="w-3 h-3" />} label="Varanda" />}
                    {p.hasGym && <FeatureChip icon={<Dumbbell className="w-3 h-3" />} label="Academia" />}
                    {p.hasGameRoom && <FeatureChip icon={<Gamepad2 className="w-3 h-3" />} label="Sala de jogos" />}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                    <Button size="sm" asChild className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
                      <Link href="/dashboard/bookings/new">
                        Agendar limpeza <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild className="rounded-xl border-slate-200">
                      <Link href={`/dashboard/properties/${p.id}/edit`}>Editar</Link>
                    </Button>
                    <PropertyActions propertyId={p.id} propertyName={p.nickname} />
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add new card */}
          <Link
            href="/dashboard/properties/new"
            className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center py-10 gap-3 text-slate-400 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/30 transition-all min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold">Adicionar outro imóvel</span>
          </Link>
        </div>
      )}
    </div>
  )
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-full border border-slate-100">
      {icon}{label}
    </span>
  )
}
