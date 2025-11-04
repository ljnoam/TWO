'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { supabase } from '@/lib/supabase/client'

export type CoupleStatus = {
  userId: string
  coupleId: string | null
  joinCode: string | null
  startedAt: string | null
  membersCount: number
}

interface UseCoupleOptions {
  skip?: boolean
}

const INITIAL_STATUS: CoupleStatus = {
  userId: '',
  coupleId: null,
  joinCode: null,
  startedAt: null,
  membersCount: 0,
}

export function useCouple(options: UseCoupleOptions = {}) {
  const { skip = false } = options
  const [status, setStatus] = useState<CoupleStatus | null>(skip ? null : INITIAL_STATUS)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState<Error | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const fetchStatus = useCallback(async () => {
    if (skip) return null

    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError

      const session = authData.session
      if (!session) {
        setIsAuthenticated(false)
        setStatus(null)
        return null
      }

      setIsAuthenticated(true)

      const { data, error: statusError } = await supabase
        .from('my_couple_status')
        .select('user_id, couple_id, join_code, started_at, members_count')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (statusError) throw statusError

      if (!data) {
        const next: CoupleStatus = {
          userId: session.user.id,
          coupleId: null,
          joinCode: null,
          startedAt: null,
          membersCount: 0,
        }
        setStatus(next)
        return next
      }

      const next: CoupleStatus = {
        userId: data.user_id,
        coupleId: data.couple_id,
        joinCode: data.join_code ?? null,
        startedAt: data.started_at ?? null,
        membersCount: typeof data.members_count === 'number' ? data.members_count : Number(data.members_count ?? 0),
      }
      setStatus(next)
      return next
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error('Impossible de récupérer votre statut de couple')
      setError(normalized)
      setStatus(null)
      throw normalized
    } finally {
      setLoading(false)
    }
  }, [skip])

  useEffect(() => {
    let active = true
    if (skip) {
      setLoading(false)
      return () => {
        active = false
      }
    }

    fetchStatus().catch(() => {
      if (active) {
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [fetchStatus, skip])

  const refresh = useCallback(async () => {
    return fetchStatus()
  }, [fetchStatus])

  const hasCouple = useMemo(() => Boolean(status?.coupleId), [status])
  const isWaiting = useMemo(() => hasCouple && (status?.membersCount ?? 0) < 2, [hasCouple, status?.membersCount])

  return {
    status,
    loading,
    error,
    refresh,
    hasCouple,
    isWaiting,
    isAuthenticated,
  }
}
