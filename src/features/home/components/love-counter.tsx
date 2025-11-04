'use client'

import { useMemo } from 'react'
import { Heart } from 'lucide-react'

import { useCouple } from '@/lib/hooks/useCouple'
import { cn } from '@/lib/utils'

export default function LoveCounter() {
  const { status, loading, isAuthenticated } = useCouple()

  const startedAt = status?.startedAt ? new Date(status.startedAt) : null
  const daysTogether = useMemo(() => {
    if (!startedAt) return null
    const diffMs = Date.now() - startedAt.getTime()
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  }, [startedAt])

  const subtitle = startedAt
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(startedAt)
    : null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-black/10 bg-white/80 p-5 shadow-xl backdrop-blur-md',
        'dark:border-white/10 dark:bg-neutral-900/60 sm:p-6'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-widest text-pink-500 dark:text-pink-300">
            En couple depuis
          </p>
          {loading ? (
            <div className="mt-1 h-10 w-24 animate-pulse rounded-lg bg-black/10 dark:bg-white/10" aria-hidden />
          ) : daysTogether !== null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tabular-nums">{daysTogether}</span>
              <span className="text-sm font-medium opacity-70">jours</span>
            </div>
          ) : (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {isAuthenticated === false
                ? 'Connecte-toi pour suivre votre aventure.'
                : 'Renseigne votre date de rencontre dans le profil.'}
            </p>
          )}
          {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400">Depuis le {subtitle}</p>}
        </div>
        <Heart className="h-10 w-10 text-pink-500 opacity-80 dark:text-pink-400" aria-hidden />
      </div>
    </div>
  )
}
