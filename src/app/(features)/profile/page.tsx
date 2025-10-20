'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import DarkModeToggle from '@/components/ui/DarkModeToggle'
import AvatarUploader from '@/components/profile/AvatarUploader'
import { Bell, BellOff, LogOut, Heart } from 'lucide-react'
import { enablePush, disablePush } from '@/lib/push'

type CoupleStatus = {
  couple_id: string
  started_at: string
  code: string | null
  members_count: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [profile, setProfile] = useState<{ first_name?: string | null; avatar_url?: string | null } | null>(null)
  const [status, setStatus] = useState<CoupleStatus | null>(null)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [firstNameInput, setFirstNameInput] = useState('')
  const [partner, setPartner] = useState<{ first_name?: string | null; display_name?: string | null; avatar_url?: string | null } | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session) {
        router.replace('/register')
        return
      }
      const user = s.session.user
      setMe(user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(prof ?? null)
      setFirstNameInput(prof?.first_name ?? '')

      const { data: cm } = await supabase.from('couple_members').select('couple_id').eq('user_id', user.id).maybeSingle()
      if (!cm?.couple_id) {
        router.replace('/onboarding')
        return
      }

      const { data: c } = await supabase.from('couples').select('id, started_at, code').eq('id', cm.couple_id).maybeSingle()
      const { data: p } = await supabase
        .from('couple_members')
        .select('user_id, profiles(first_name, display_name, avatar_url)')
        .eq('couple_id', cm.couple_id)
        .neq('user_id', user.id)

      const partnerProf = p?.[0]?.profiles
        ? {
            first_name: p[0].profiles.first_name,
            display_name: p[0].profiles.display_name,
            avatar_url: p[0].profiles.avatar_url,
          }
        : null

      setPartner(partnerProf)

      const { count } = await supabase.from('couple_members').select('*', { count: 'exact', head: true }).eq('couple_id', cm.couple_id)
      setStatus(c ? { couple_id: c.id, started_at: c.started_at, code: c.code, members_count: count ?? 0 } : null)

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        setPushEnabled(!!sub)
      }
    })()
  }, [router])

  const daysTogether = useMemo(() => {
    if (!status?.started_at) return null
    const start = new Date(status.started_at)
    const a = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
    const now = new Date()
    const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    return Math.max(0, Math.floor((b - a) / (24 * 3600 * 1000)))
  }, [status?.started_at])

  async function saveFirstName() {
    if (!me) return
    const n = firstNameInput.trim()
    const { error } = await supabase.from('profiles').update({ first_name: n || null }).eq('id', me.id)
    if (!error) {
      setProfile((p) => ({ ...(p ?? {}), first_name: n || null }))
      setEditingName(false)
    } else alert(error.message)
  }

  async function onAvatarChange(url: string) {
    setProfile((p) => ({ ...(p ?? {}), avatar_url: url }))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/register')
  }

  async function togglePush() {
    if (!pushEnabled) {
      const ok = await enablePush()
      if (ok) setPushEnabled(true)
    } else {
      const ok = await disablePush()
      if (ok) setPushEnabled(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pt-8 pb-[calc(var(--nav-h)+24px)] space-y-6 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Salut {profile?.first_name || 'toi'} 👋</h1>
        <DarkModeToggle />
      </div>

      {/* Profil */}
      {me && (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md shadow p-5 flex flex-col items-center sm:flex-row gap-4">
          <AvatarUploader userId={me.id} avatarUrl={profile?.avatar_url} onChange={onAvatarChange} />
          <div className="flex-1 text-center sm:text-left">
            {!editingName ? (
              <div className="flex flex-col items-center sm:items-start gap-1">
                <p className="text-lg font-semibold">{profile?.first_name || 'Prénom non défini'}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs rounded-full px-3 py-1 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  Modifier
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <input
                  value={firstNameInput}
                  onChange={(e) => setFirstNameInput(e.target.value)}
                  placeholder="Ton prénom"
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 outline-none text-sm"
                />
                <button
                  onClick={saveFirstName}
                  className="text-xs rounded-lg px-2 py-1 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setEditingName(false)
                    setFirstNameInput(profile?.first_name || '')
                  }}
                  className="text-xs rounded-lg px-2 py-1 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Annuler
                </button>
              </div>
            )}
            <p className="text-xs opacity-70 mt-1">{me.email}</p>
          </div>
        </div>
      )}

      {/* Couple */}
      {status && (
        <div className="rounded-2xl border border-pink-200/20 dark:border-pink-800/20 bg-gradient-to-r from-pink-50/80 to-rose-100/80 dark:from-pink-900/20 dark:to-rose-800/20 backdrop-blur-lg shadow-sm p-5 text-center">
          <Heart className="mx-auto h-5 w-5 text-pink-500 mb-1" />
          <p className="text-sm opacity-70">En couple depuis le</p>
          <p className="text-lg font-bold">{new Date(status.started_at).toLocaleDateString('fr-FR')}</p>
          {daysTogether !== null && <p className="text-sm opacity-70">Soit {daysTogether} jours 🫶</p>}
          {partner && (
            <p className="text-sm mt-1">
              <span className="opacity-70">Avec </span>
              <span className="font-semibold">{partner.first_name || partner.display_name || 'Ton/ta partenaire'}</span>
            </p>
          )}
          <p className="text-xs opacity-60 mt-2">Code du couple : {status.code || '—'}</p>
        </div>
      )}

      {/* Stats */}
      <StatsRow coupleId={status?.couple_id} />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={togglePush}
          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black text-white dark:bg-white dark:text-black px-4 py-3 font-medium shadow hover:opacity-90 transition"
        >
          {pushEnabled ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {pushEnabled ? 'Désactiver les notifs' : 'Activer les notifs'}
        </button>

        <button
          onClick={logout}
          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 px-4 py-3 font-medium shadow hover:bg-white/90 dark:hover:bg-neutral-800 transition"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </main>
  )
}

/* === STATS === */
function StatsRow({ coupleId }: { coupleId?: string | null }) {
  const [notes, setNotes] = useState<number | null>(null)
  const [todo, setTodo] = useState<number | null>(null)
  const [done, setDone] = useState<number | null>(null)

  useEffect(() => {
    if (!coupleId) return
    ;(async () => {
      const { count: notesCount } = await supabase.from('love_notes').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId)
      const { count: todoCount } = await supabase
        .from('bucket_items')
        .select('*', { count: 'exact', head: true })
        .eq('couple_id', coupleId)
        .eq('is_done', false)
      const { count: doneCount } = await supabase
        .from('bucket_items')
        .select('*', { count: 'exact', head: true })
        .eq('couple_id', coupleId)
        .eq('is_done', true)
      setNotes(notesCount ?? 0)
      setTodo(todoCount ?? 0)
      setDone(doneCount ?? 0)
    })()
  }, [coupleId])

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Mots doux" value={notes ?? '…'} />
      <StatCard label="À faire" value={todo ?? '…'} />
      <StatCard label="Faits" value={done ?? '…'} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md p-4 text-center shadow-sm hover:scale-[1.02] transition-transform">
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  )
}
