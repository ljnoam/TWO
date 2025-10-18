'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DaysSinceCouple from '@/components/counter/DaysSinceCouple';

export default function HomePage() {
  const router = useRouter();
  const [startedAt, setStartedAt] = useState<string|undefined>();

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { router.replace('/register'); return; }
      const { data } = await supabase
        .from('my_couple_status')
        .select('*')
        .eq('user_id', s.session.user.id)
        .maybeSingle();
      if (!data) { router.replace('/onboarding'); return; }
      if (data.members_count < 2) { router.replace('/waiting'); return; }
      setStartedAt(data.started_at);
    })();
  }, [router]);

  return (
    <main className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* bento counter flottant en tête */}
      <div>
        <DaysSinceCouple />
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Bienvenue ❤️</h1>
        {startedAt && (
          <p className="opacity-75 text-sm">
            En couple depuis le {new Date(startedAt).toLocaleDateString()}
          </p>
        )}
      </div>
      {/* ... ton contenu */}
    </main>
  );
}
