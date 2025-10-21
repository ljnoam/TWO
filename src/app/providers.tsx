'use client'

import { ThemeProvider } from 'next-themes'
import { useEffect } from 'react'
import { flushOutbox } from '@/lib/outbox'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('[SW] enregistré'))
        .catch((err) => console.warn('[SW] erreur', err))
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (ev) => {
        if (ev.data === 'FLUSH_OUTBOX') {
          flushOutbox();
        }
      });
    }

    window.addEventListener('online', () => {
      flushOutbox();
    });
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}

