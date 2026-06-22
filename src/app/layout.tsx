import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthSessionProvider } from '@/components/shared/session-provider'
import { Toaster } from '@/components/ui/sonner'
import { I18nProvider } from '@/lib/i18n/context'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const viewport: Viewport = {
  themeColor: '#14b8a6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'HubNestly — Home Care Platform',
  description: 'Agende sua limpeza residencial em Fort Myers, Naples, Bonita Springs e Lehigh Acres. Preço transparente, pagamento online, equipe profissional.',
  keywords: 'limpeza residencial, house cleaning, Fort Myers, Naples, Bonita Springs, Lehigh Acres, Florida',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HubNestly',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'HubNestly — Home Care Platform',
    description: 'Seu lar, sempre impecável. Agende em minutos, pague online, relaxe.',
    type: 'website',
    images: ['/icons/icon-512x512.png'],
  },
  twitter: {
    card: 'summary',
    title: 'HubNestly',
    description: 'Limpeza residencial simplificada',
    images: ['/icons/icon-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    other: [{ rel: 'mask-icon', url: '/icons/icon-192x192.png' }],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <I18nProvider>
          <AuthSessionProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthSessionProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
