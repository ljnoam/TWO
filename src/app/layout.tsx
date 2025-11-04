import '../styles/globals.css'

import type { ReactNode } from 'react'

import { getServerSession } from '@/lib/supabase/server'

import Providers from './providers'

export const viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
}

export const metadata = {
  title: 'TWO',
  description: 'App de couple',
  manifest: '/manifest.json?v=20251023',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Nous',
    statusBarStyle: 'black-translucent',
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { session } = await getServerSession()

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className="min-h-screen bg-white text-neutral-900 font-sans antialiased dark:bg-neutral-950 dark:text-neutral-50"
        data-has-session={session ? '1' : '0'}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
