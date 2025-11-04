'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Heart, ListChecks, Send } from 'lucide-react'

import { PageLayout } from '@/components/common/PageLayout'
import ActivityWidget from '@/features/home/components/ActivityWidget'
import LoveCounter from '@/features/home/components/love-counter'
import { supabase } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session) {
        router.replace('/register')
        return
      }
      const uid = s.session.user.id

      const { data } = await supabase
        .from('my_couple_status')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle()
      if (!data) {
        router.replace('/onboarding')
        return
      }
      if (data.members_count < 2) {
        router.replace('/waiting')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', uid)
        .maybeSingle()
      setFirstName(prof?.first_name ?? null)
    })()
  }, [router])

  return (
    <PageLayout>
      <div className="space-y-5 sm:space-y-6">
        <section className="space-y-4">
          <LoveCounter />
          <div className="rounded-3xl border border-black/10 bg-white/70 p-5 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/60 sm:p-6">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" aria-hidden />
              <h1 className="text-2xl font-bold tracking-tight" aria-live="polite">
                {`Bienvenue`} {firstName ? `❤️ ${firstName}` : '❤️'}
              </h1>
            </div>
            <p className="mt-2 text-sm opacity-70">Heureux de vous revoir ici.</p>
          </div>
        </section>

        <section aria-label="Actions rapides" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <HomeCTA
            href="/notes"
            label="Écrire un mot doux"
            ariaLabel="Aller écrire un mot doux"
            icon={<Send className="h-4 w-4" />}
          />
          <HomeCTA
            href="/bucket"
            label="Ajouter à la bucket"
            ariaLabel="Ajouter un élément à la bucket list"
            icon={<ListChecks className="h-4 w-4" />}
          />
          <HomeCTA
            href="/calendar"
            label="Créer un événement"
            ariaLabel="Créer un événement"
            icon={<CalendarPlus className="h-4 w-4" />}
          />
        </section>

        <ActivityWidget />
      </div>
    </PageLayout>
  )
}

function HomeCTA({
  href,
  label,
  ariaLabel,
  icon,
}: {
  href: string
  label: string
  ariaLabel: string
  icon?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group block w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-4 font-medium shadow transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/40 active:scale-[0.99] dark:border-white/10 dark:bg-neutral-900/70"
    >
      <span className="flex items-center justify-center gap-2">
        {icon && (
          <span className="shrink-0 text-pink-600 transition-transform group-hover:scale-105 dark:text-pink-400">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </span>
    </Link>
  )
}
