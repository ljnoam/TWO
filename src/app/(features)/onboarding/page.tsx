'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type Status = { couple_id: string|null; join_code?: string|null; started_at?: string|null; members_count?: number|null };

async function fetchStatus(): Promise<Status> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return { couple_id: null };
  const { data, error } = await supabase
    .from('my_couple_status')
    .select('*')
    .eq('user_id', session.session.user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? {
    couple_id: data.couple_id,
    join_code: data.join_code,
    started_at: data.started_at,
    members_count: data.members_count
  } : { couple_id: null };
}

export default function Onboarding() {
  const router = useRouter();
  const [mode, setMode] = useState<'create'|'join'>('create');
  const [startedAt, setStartedAt] = useState<string>(new Date().toISOString().slice(0,10));
  const [code, setCode] = useState('');
  const [waitingCode, setWaitingCode] = useState<string|undefined>();

  // Redirects selon status
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { router.replace('/register'); return; }

      const st = await fetchStatus();
      if (!st.couple_id) return; // reste sur onboarding

      if (st.members_count === 1) {
        setWaitingCode(st.join_code ?? undefined);
        router.replace('/waiting'); // la page waiting réaffichera le code
      } else if (st.members_count === 2) {
        router.replace('/home');
      }
    })();
  }, [router]);

  return (
    <main className="space-y-4 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold">Créer ou rejoindre ton couple</h1>

      <div className="flex gap-2">
        <button className={`border rounded px-3 py-2 ${mode==='create'?'bg-black text-white':''}`} onClick={()=>setMode('create')}>Créer</button>
        <button className={`border rounded px-3 py-2 ${mode==='join'?'bg-black text-white':''}`} onClick={()=>setMode('join')}>Rejoindre</button>
      </div>

      {mode==='create' ? (
        <form className="space-y-3" onSubmit={async (e)=> {
          e.preventDefault();
          const { error, data } = await supabase.rpc('create_couple', { p_started_at: startedAt });
          if (error) { alert(error.message); return; }
          // data: { couple_id, join_code }
          router.replace('/waiting');
        }}>
          <label className="block text-sm">Date de mise en couple</label>
          <input type="date" value={startedAt} onChange={e=>setStartedAt(e.target.value)} className="w-full border rounded px-3 py-2" />
          <button className="w-full border rounded px-3 py-2">Créer</button>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={async (e)=> {
          e.preventDefault();
          const { error } = await supabase.rpc('join_couple', { p_join_code: code.trim().toUpperCase() });
          if (error) { alert(error.message); return; }
          router.replace('/home');
        }}>
          <label className="block text-sm">Code couple</label>
          <input value={code} onChange={e=>setCode(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="ABC123" />
          <button className="w-full border rounded px-3 py-2">Rejoindre</button>
        </form>
      )}
    </main>
  );
}
