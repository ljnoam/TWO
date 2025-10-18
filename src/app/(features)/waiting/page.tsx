'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function WaitingPage() {
  const router = useRouter();
  const [code, setCode] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { router.replace('/register'); return; }

      const { data, error } = await supabase
        .from('my_couple_status')
        .select('*')
        .eq('user_id', s.session.user.id)
        .single();

      if (error) { console.error(error); return; }

      if (!data?.couple_id) {
        router.replace('/onboarding');
        return;
      }

      setCode(data.join_code);

      if (data.members_count === 2) {
        router.replace('/home');
        return;
      }

      // realtime: bouge dès que le 2e membre arrive
      const channel = supabase
        .channel('couple_waiting')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${data.couple_id}`},
          async () => {
            const { data: st } = await supabase
              .from('my_couple_status').select('*').eq('user_id', s.session!.user.id).single();
            if (st?.members_count === 2) router.replace('/home');
          })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    })();
  }, [router]);

  return (
    <main className="space-y-4 text-center max-w-sm mx-auto">
      <h1 className="text-xl font-semibold">En attente de ton/ta partenaire…</h1>
      <p>Partage ce code :</p>
      <div className="text-4xl font-bold tracking-widest">{code || '------'}</div>
      <p className="text-sm opacity-70">Dès qu’il/elle rejoint, on te redirige automatiquement.</p>
    </main>
  );
}
