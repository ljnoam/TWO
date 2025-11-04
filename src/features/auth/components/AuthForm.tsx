'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Lock, Mail } from 'lucide-react'

import { supabase } from '@/lib/supabase/client'

import { cn } from '@/lib/utils'

type Mode = 'login' | 'register'

export default function AuthForm({ defaultMode = 'login' as Mode }: { defaultMode?: Mode }) {
  const router = useRouter()
  const search = useSearchParams()
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/home')
    })
  }, [router])

  const title = useMemo(() => (mode === 'login' ? 'Connexion' : 'Créer un compte'), [mode])
  const cta = useMemo(() => (mode === 'login' ? 'Se connecter' : "S'inscrire"), [mode])
  const switchText = useMemo(() => (mode === 'login' ? 'Pas de compte ?' : 'Déjà inscrit·e ?'), [mode])
  const switchCta = useMemo(() => (mode === 'login' ? 'Créer un compte' : 'Se connecter'), [mode])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        router.replace('/login?verify=1')
        return
      }
      router.replace('/onboarding')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action impossible pour le moment'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = cn(
    'w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2.5 text-sm shadow-sm transition',
    'focus:outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-neutral-900/60 dark:focus:ring-white/20'
  )
  const btnCls = cn(
    'w-full rounded-xl px-4 py-2.5 text-sm font-medium transition',
    'bg-black text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60',
    'dark:bg-white dark:text-black dark:hover:bg-white/90'
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 text-2xl font-semibold">
        <Heart className="h-6 w-6 text-pink-500" aria-hidden />
        <span>Nous</span>
      </div>

      {search?.get('verify') && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200">
          Un e‑mail de confirmation vient d&apos;être envoyé. Vérifie ta boîte mail puis connecte‑toi.
        </div>
      )}

      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm opacity-70">Accède à ton espace de couple</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1">
            <span className="block text-sm opacity-70">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" aria-hidden />
              <input
                className={cn(inputCls, 'pl-9')}
                placeholder="toi@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
              />
            </div>
          </label>

          <label className="block space-y-1">
            <span className="block text-sm opacity-70">Mot de passe</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" aria-hidden />
              <input
                className={cn(inputCls, 'pl-9')}
                placeholder="••••••••"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <button className={btnCls} disabled={loading}>
            {loading ? 'Patiente…' : cta}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="mr-2 opacity-70">{switchText}</span>
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="font-medium underline decoration-dotted underline-offset-4"
            type="button"
          >
            {switchCta}
          </button>
        </div>
      </div>
    </div>
  )
}
