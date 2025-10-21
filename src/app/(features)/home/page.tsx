'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DaysSinceCouple from '@/components/counter/DaysSinceCouple';
import ActivityWidget from '@/components/home/ActivityWidget';

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
    <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Counter bento */}
      <div>
        <DaysSinceCouple />
      </div>

      {/* Heading + Warm welcome */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight" aria-live="polite">
          Bienvenue ❤️ {firstName || 'toi'}
        </h1>
        <p className="opacity-70 text-sm mt-1">Heureux de vous revoir ici.</p>
      </header>

      {/* CTAs */}
      <section aria-label="Actions rapides" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <HomeCTA href="/notes" label="Écrire un mot doux" ariaLabel="Aller écrire un mot doux" />
        <HomeCTA href="/bucket" label="Ajouter à la bucket" ariaLabel="Ajouter un élément à la bucket list" />
        <HomeCTA href="/calendar" label="Créer un évènement" ariaLabel="Créer un évènement" />
      </section>

      {/* Activity Widget */}
      <ActivityWidget />
    </main>
  );
}

function HomeCTA({ href, label, ariaLabel }: { href: string; label: string; ariaLabel: string }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="block text-center w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md px-4 py-4 font-medium shadow hover:opacity-95 active:scale-[0.99] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/40"
    >
      {label}
    </Link>
  );
}

