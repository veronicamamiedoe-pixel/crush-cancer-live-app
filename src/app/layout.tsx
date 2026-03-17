import type { Metadata, Viewport } from 'next'
import { Dancing_Script, Nunito } from 'next/font/google'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Crush Cancer & LIVE — Empower. Heal. Thrive.',
    template: '%s | Crush Cancer & LIVE',
  },
  description: 'The professional cancer care management platform. Track treatment, manage symptoms, stay spiritually strong, and coordinate your care team — all in one beautiful app.',
  keywords: ['cancer planner', 'cancer management', 'chemotherapy tracker', 'cancer support', 'treatment planner'],
  authors: [{ name: 'Crush Cancer & LIVE' }],
  creator: 'Crush Cancer & LIVE',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://crushcancerandlive.app',
    siteName: 'Crush Cancer & LIVE',
    title: 'Crush Cancer & LIVE — Empower. Heal. Thrive.',
    description: 'Your professional cancer care companion. Treatment tracking, symptom monitoring, spiritual support, and care coordination.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crush Cancer & LIVE',
    description: 'Your professional cancer care companion.',
  },
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#1A9EA0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dancingScript.variable} ${nunito.variable}`}>
      <body className="font-body bg-healing-bg text-gray-900 antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-body)',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#1A9EA0', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#E8196A', secondary: '#fff' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
