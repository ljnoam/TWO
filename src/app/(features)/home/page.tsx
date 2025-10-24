'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DaysSinceCouple from '@/components/counter/DaysSinceCouple';
import ActivityWidget from '@/components/home/ActivityWidget';
import { Send, ListChecks, CalendarPlus, Heart } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { router.replace('/register'); return; }
      const uid = s.session.user.id;

      const { data } = await supabase
        .from('my_couple_status')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      if (!data) { router.replace('/onboarding'); return; }
      if (data.members_count < 2) { router.replace('/waiting'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', uid)
        .maybeSingle();
      setFirstName(prof?.first_name ?? null);
    })();
  }, [router]);

  return (
    <main className="flex flex-col space-y-5 sm:space-y-6">
      {/* Hero section */}
      <section className="space-y-4">
        <DaysSinceCouple />
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight" aria-live="polite">
              {`Bienvenue`} {firstName ? `❤️ ${firstName}` : '❤️'}
            </h1>
          </div>
          <p className="opacity-70 text-sm mt-2">Heureux de vous revoir ici.</p>
        </div>
      </section>
      {/* Counter bento */}
      <div className="hidden">
        <DaysSinceCouple />
      </div>

      {/* Heading + Warm welcome */}
      <header className="hidden">
        <h1 className="text-2xl font-bold tracking-tight" aria-live="polite">
          Bienvenue ❤️ {firstName || 'toi'}
        </h1>
        <p className="opacity-70 text-sm mt-1">Heureux de vous revoir ici.</p>
      </header>

      {/* Quick actions */}
      <section aria-label="Actions rapides" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <HomeCTA href="/notes" label="Écrire un mot doux" ariaLabel="Aller écrire un mot doux" icon={<Send className="h-4 w-4" />} />
        <HomeCTA href="/bucket" label="Ajouter à la bucket" ariaLabel="Ajouter un élément à la bucket list" icon={<ListChecks className="h-4 w-4" />} />
        <HomeCTA href="/calendar" label="Créer un événement" ariaLabel="Créer un événement" icon={<CalendarPlus className="h-4 w-4" />} />
      </section>

      {/* CTAs */}
      <div className="px-1">
        <h2 className="text-sm font-semibold opacity-70">Aper�?�u rapide</h2>
      </div>
      <section aria-label="Actions rapides" className="hidden grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <HomeCTA href="/notes" label="Écrire un mot doux" ariaLabel="Aller écrire un mot doux" />
        <HomeCTA href="/bucket" label="Ajouter à la bucket" ariaLabel="Ajouter un élément à la bucket list" />
        <HomeCTA href="/calendar" label="Créer un évènement" ariaLabel="Créer un évènement" />
      </section>

      {/* Activity Widget */}
      <ActivityWidget />
    </main>
  );
}

function HomeCTA({ href, label, ariaLabel, icon }: { href: string; label: string; ariaLabel: string; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group block w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md px-4 py-4 font-medium shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/40 hover:shadow-md active:scale-[0.99]"
    >
      <span className="flex items-center justify-center gap-2">
        {icon && <span className="shrink-0 text-pink-600 dark:text-pink-400 group-hover:scale-105 transition-transform">{icon}</span>}
        <span>{label}</span>
      </span>
    </Link>
  );
}
