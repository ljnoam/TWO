import '../styles/globals.css'
import Providers from './providers'

export const metadata = {
  title: 'Nous2',
  description: 'App de couple ❤️',
  manifest: '/manifest.json',
  themeColor: '#ff3b81',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Nous2',
  },
}



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`
          min-h-[100svh]
          bg-white text-neutral-900
          dark:bg-neutral-950 dark:text-neutral-50
          font-sans antialiased flex flex-col overflow-hidden
        `}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
