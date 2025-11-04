'use client'

import { ThemeProvider } from 'next-themes'
import { createBrowserClient } from '@supabase/ssr'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { flushOutbox } from '@/lib/pwa/outbox'
import { enablePush } from '@/lib/pwa/push'

// --- CONTEXTE SUPABASE ---
const SupabaseContext = createContext<any>(null)

export function useSupabase() {
  return useContext(SupabaseContext)
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const router = useRouter()

  useEffect(() => {
    // Nettoyer les sessions invalides
    supabase.auth.getSession().then(({ error }) => {
      if (error && /Invalid Refresh Token/i.test(String(error.message))) {
        supabase.auth.signOut().catch(() => {})
      }
    })

    const ensurePushSubscription = async (force = false) => {
      try {
        if (typeof window === 'undefined') return
        if (!('Notification' in window) || Notification.permission !== 'granted') return
        if (!('serviceWorker' in navigator)) return
        await enablePush({ forceResubscribe: force })
      } catch (err) {
        console.warn('[push] auto ensure failed', err)
      }
    }

    const onSwMessage = (ev: MessageEvent<any>) => {
      const payload = ev.data
      if (payload === 'FLUSH_OUTBOX') {
        flushOutbox()
        return
      }
      if (payload === 'REFRESH_DONE') {
        try {
          router.refresh()
          document.dispatchEvent(new Event('app:refresh'))
          document.dispatchEvent(new Event('visibilitychange'))
        } catch {}
        return
      }
      if (payload && typeof payload === 'object') {
        const type = (payload as { type?: string }).type
        if (type === 'PUSH_SUBSCRIPTION_CHANGED') {
          ensurePushSubscription(true).catch(() => {})
        }
        if (type === 'PUSH_SUBSCRIPTION_RENEWED') {
          ensurePushSubscription(false).catch(() => {})
        }
      }
    }

    const onOnline = async () => {
      flushOutbox()
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready
          if ('SyncManager' in window && 'sync' in reg) {
            try {
              await reg.sync.register('pages-sync')
            } catch {
              navigator.serviceWorker.controller?.postMessage('REFRESH_ROUTES')
            }
          } else {
            navigator.serviceWorker.controller?.postMessage('REFRESH_ROUTES')
          }
        }
      } catch {}
    }

    const swUrl = '/sw.js?v=20251023'
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(swUrl)
        .then(() => {
          console.log('[SW] enregistré')
          ensurePushSubscription(false).catch(() => {})
        })
        .catch((err) => console.warn('[SW] erreur', err))

      navigator.serviceWorker.addEventListener('message', onSwMessage)
    }

    window.addEventListener('online', onOnline)

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage)
      }
      window.removeEventListener('online', onOnline)
    }
  }, [router, supabase])

  useEffect(() => {
    const updateViewportHeight = () => {
      const visualViewport = window.visualViewport
      const height = visualViewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--viewport-height', `${height}px`)
    }

    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)
    window.visualViewport?.addEventListener('resize', updateViewportHeight)

    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
      window.visualViewport?.removeEventListener('resize', updateViewportHeight)
    }
  }, [])

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SupabaseContext.Provider>
  )
}
