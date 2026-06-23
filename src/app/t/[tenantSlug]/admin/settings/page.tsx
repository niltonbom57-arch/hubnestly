export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { resolveTenantBySlug } from '@/lib/tenant/resolver'
import { getTenantSettings } from '@/lib/tenant/settings'
import { BrandingForm } from '@/components/admin/settings/BrandingForm'
import { PricingEditor } from '@/components/admin/settings/PricingEditor'
import { ScheduleEditor } from '@/components/admin/settings/ScheduleEditor'
import { StripeConnectCard } from '@/components/admin/settings/StripeConnectCard'
import { StripeConnectToast } from '@/components/admin/settings/StripeConnectToast'
import { CustomDomainCard } from '@/components/admin/settings/CustomDomainCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Palette, DollarSign, Clock, CreditCard, Globe } from 'lucide-react'

interface Props {
  params: { tenantSlug: string }
}

export default async function SettingsPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as { tenantId?: string; role?: string } | undefined

  const tenant = await resolveTenantBySlug(params.tenantSlug)
  if (!tenant) notFound()

  // Apenas admin do próprio tenant
  if (sessionUser?.tenantId !== tenant.id || sessionUser?.role !== 'ADMIN') {
    notFound()
  }

  const settings = await getTenantSettings(tenant.id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <StripeConnectToast />
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">
          Personalize como o {tenant.name} aparece para seus clientes
        </p>
      </div>

      <Tabs defaultValue="branding">
        <TabsList className="w-full">
          <TabsTrigger value="branding" className="flex-1 gap-2">
            <Palette className="w-4 h-4" /> Identidade
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex-1 gap-2">
            <DollarSign className="w-4 h-4" /> Preços
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 gap-2">
            <Clock className="w-4 h-4" /> Horários
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex-1 gap-2">
            <CreditCard className="w-4 h-4" /> Pagamentos
          </TabsTrigger>
          <TabsTrigger value="domain" className="flex-1 gap-2">
            <Globe className="w-4 h-4" /> Domínio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-6">
          <BrandingForm
            tenantSlug={params.tenantSlug}
            initialSettings={settings}
            tenantName={tenant.name}
          />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <PricingEditor
            tenantSlug={params.tenantSlug}
            initialSettings={settings}
          />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <ScheduleEditor
            tenantSlug={params.tenantSlug}
            initialSettings={settings}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Pagamentos via Stripe</h2>
            <p className="text-sm text-gray-500">
              Conecte sua conta Stripe para receber os pagamentos dos seus clientes diretamente.
            </p>
          </div>
          <div className="mt-4">
            <StripeConnectCard />
          </div>
        </TabsContent>

        <TabsContent value="domain" className="mt-6">
          <div className="space-y-2 mb-6">
            <h2 className="text-lg font-semibold">Domínio e acesso</h2>
            <p className="text-sm text-gray-500">
              Configure um domínio personalizado para sua página de agendamento. Seus clientes verão apenas a sua marca.
            </p>
          </div>
          <CustomDomainCard
            tenantSlug={params.tenantSlug}
            currentDomain={tenant.customDomain ?? null}
      />
        </TabsContent>
      </Tabs>
    </div>
  )
}
