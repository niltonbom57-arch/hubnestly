import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export const metadata = { title: 'Criar conta — CleanBookFL' }

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <OnboardingWizard />
    </main>
  )
}
