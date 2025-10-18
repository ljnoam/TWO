'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';

type Item = {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  is_done: boolean;
  done_at: string | null;
  created_at: string;
};

export default function BucketPage() {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');

  // Guards + fetch initial
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { router.replace('/register'); return; }
      setMe(s.session.user.id);

      const { data: st } = await supabase
        .from('my_couple_status')
        .select('*')
        .eq('user_id', s.session.user.id)
        .maybeSingle();

      if (!st) { router.replace('/onboarding'); return; }
      if (st.members_count < 2) { router.replace('/waiting'); return; }

      setCoupleId(st.couple_id);

      const { data } = await supabase
        .from('bucket_items')
        .select('id, couple_id, author_id, title, is_done, done_at, created_at')
        .eq('couple_id', st.couple_id)
        .order('is_done', { ascending: true })
        .order('created_at', { ascending: true });

      setItems(data ?? []);
    })();
  }, [router]);

  // 🔥 Realtime universel (on filtre côté client sur couple_id)
  useEffect(() => {
    const ch = supabase
      .channel('bucket_items_all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bucket_items' }, (p) => {
        const row = p.new as Item;
        setItems(prev => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          if (prev.find(i => i.id === row.id)) return prev;
          return [...prev, row];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bucket_items' }, (p) => {
        const row = p.new as Item;
        setItems(prev => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          return prev.map(i => i.id === row.id ? row : i);
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bucket_items' }, (p) => {
        const row = p.old as Item;
        setItems(prev => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          return prev.filter(i => i.id !== row.id);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [coupleId]);

  // 🔁 Resync quand l’app redevient visible (wake/sleep)
  useEffect(() => {
    async function refetch() {
      if (!coupleId || document.hidden) return;
      const { data } = await supabase
        .from('bucket_items')
        .select('id, couple_id, author_id, title, is_done, done_at, created_at')
        .eq('couple_id', coupleId)
        .order('is_done', { ascending: true })
        .order('created_at', { ascending: true });
      setItems(data ?? []);
    }
    document.addEventListener('visibilitychange', refetch);
    return () => document.removeEventListener('visibilitychange', refetch);
  }, [coupleId]);

  const remaining = useMemo(() => items.filter(i => !i.is_done).length, [items]);

  // ➕ Ajouter (optimistic + fallback)
  async function addItem() {
    const title = input.trim();
    if (!title || !me || !coupleId) return;
    setInput('');
    // pas d’optimistic ici (on laisse le realtime ajouter pour éviter doublon)
    const { error } = await supabase.from('bucket_items').insert({
        title, couple_id: coupleId, author_id: me
    });

    if (error) {
        setInput(title);
        alert(error.message);
        return;
    }

    // ✅ Envoi de la notif push au partenaire
    try {
        await fetch('/api/push/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bucketTitle: title, // on passe le titre ajouté
                type: 'bucket'
            }),
        });
    } catch (err) {
        console.warn('Erreur lors de l’envoi de la notif:', err);
    }
  }

  // ✅ Toggle (optimistic)
  async function toggleItem(id: string, is_done: boolean) {
    const newVal = !is_done;
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_done: newVal, done_at: newVal ? new Date().toISOString() : null } : i));
    const { error } = await supabase
      .from('bucket_items')
      .update({ is_done: newVal, done_at: newVal ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) alert(error.message);
  }

  // 🗑️ Delete (optimistic)
  async function delItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from('bucket_items').delete().eq('id', id);
    if (error) alert(error.message);
  }

  return (
    <main className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-lg p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Bucket list</h1>
          <span className="text-sm opacity-70">{remaining} à faire</span>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ajouter une idée à deux…"
            className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
          />
          <button
            onClick={addItem}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black text-white dark:bg-white dark:text-black px-3 py-2 font-medium disabled:opacity-50"
            disabled={!input.trim()}
          >
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow p-4 text-sm opacity-70">
            Aucune idée pour l’instant. Proposez-en une !
          </li>
        ) : (
          items
            .sort((a, b) => Number(a.is_done) - Number(b.is_done) || a.created_at.localeCompare(b.created_at))
            .map(item => (
              <li key={item.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow p-3 sm:p-4 flex items-center justify-between gap-3">
                <button
                  className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg.white/10"
                  onClick={() => toggleItem(item.id, item.is_done)}
                  aria-label={item.is_done ? 'Marquer non fait' : 'Marquer fait'}
                  title={item.is_done ? 'Marquer non fait' : 'Marquer fait'}
                >
                  {item.is_done ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                </button>
                <div className="flex-1">
                  <p className={`text-base sm:text-lg ${item.is_done ? 'line-through opacity-60' : ''}`}>{item.title}</p>
                  {item.is_done && item.done_at && (
                    <p className="text-xs opacity-60">Fait le {new Date(item.done_at).toLocaleDateString()}</p>
                  )}
                </div>
                <button
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => delItem(item.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))
        )}
      </ul>
    </main>
  );
}
