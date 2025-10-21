'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Plus, CheckCircle2, Circle, Trash2, GripVertical, CalendarPlus } from 'lucide-react';

type Item = {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  is_done: boolean;
  done_at: string | null;
  created_at: string;
  position?: number;
};

export default function BucketPage() {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [convertFor, setConvertFor] = useState<{ id: string; title: string } | null>(null);
  const [convertAt, setConvertAt] = useState<string>('');
  const [deleteAfterConvert, setDeleteAfterConvert] = useState(true);

  // Guards + fetch initial
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        router.replace('/register');
        return;
      }
      setMe(s.session.user.id);

      const { data: st } = await supabase
        .from('my_couple_status')
        .select('*')
        .eq('user_id', s.session.user.id)
        .maybeSingle();

      if (!st) {
        router.replace('/onboarding');
        return;
      }
      if (st.members_count < 2) {
        router.replace('/waiting');
        return;
      }

      setCoupleId(st.couple_id);

      let list: Item[] | null = null;
      if (!navigator.onLine) {
        try {
          const cached = localStorage.getItem(`cache_bucket_${st.couple_id}`);
          if (cached) list = JSON.parse(cached);
        } catch {}
      }
      if (!list) {
        const { data } = await supabase
          .from('bucket_items')
          .select('id, couple_id, author_id, title, is_done, done_at, created_at, position')
          .eq('couple_id', st.couple_id)
          .order('is_done', { ascending: true })
          .order('position', { ascending: true })
          .order('created_at', { ascending: true });
        list = (data ?? []) as Item[];
        try { localStorage.setItem(`cache_bucket_${st.couple_id}`, JSON.stringify(list)); } catch {}
      }

      setItems(list ?? []);
    })();
  }, [router]);

  // 🔥 Realtime universel
  useEffect(() => {
    const ch = supabase
      .channel('bucket_items_all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bucket_items' }, (p) => {
        const row = p.new as Item;
        setItems((prev) => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          if (prev.find((i) => i.id === row.id)) return prev;
          return [...prev, row];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bucket_items' }, (p) => {
        const row = p.new as Item;
        setItems((prev) => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          return prev.map((i) => (i.id === row.id ? row : i));
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bucket_items' }, (p) => {
        const row = p.old as Item;
        setItems((prev) => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          return prev.filter((i) => i.id !== row.id);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [coupleId]);

  // 🔁 Resync on wake
  useEffect(() => {
    async function refetch() {
      if (!coupleId || document.hidden) return;
      const { data } = await supabase
        .from('bucket_items')
        .select('id, couple_id, author_id, title, is_done, done_at, created_at, position')
        .eq('couple_id', coupleId)
        .order('is_done', { ascending: true })
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      const next = (data ?? []) as Item[];
      setItems(next);
      try { localStorage.setItem(`cache_bucket_${coupleId}`, JSON.stringify(next)); } catch {}
    }
    document.addEventListener('visibilitychange', refetch);
    return () => document.removeEventListener('visibilitychange', refetch);
  }, [coupleId]);

  const remaining = useMemo(() => items.filter((i) => !i.is_done).length, [items]);
  const doneCount = useMemo(() => items.filter((i) => i.is_done).length, [items]);
  const total = items.length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  function reorderUndone(list: Item[], fromId: string, toId: string) {
    const undone = list.filter((i) => !i.is_done);
    const others = list.filter((i) => i.is_done);
    const fromIdx = undone.findIndex((i) => i.id === fromId);
    const toIdx = undone.findIndex((i) => i.id === toId);
    if (fromIdx < 0 || toIdx < 0) return list;
    const arr = undone.slice();
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    return [...arr.map((i, idx) => ({ ...i, position: idx })), ...others];
  }

  async function persistPositions() {
    if (!coupleId) return;
    const undone = items.filter((i) => !i.is_done);
    await Promise.all(
      undone.map((i, idx) => {
        if ((i.position ?? idx) !== idx) {
          return supabase.from('bucket_items').update({ position: idx }).eq('id', i.id);
        }
        return Promise.resolve({});
      })
    );
  }

  // ➕ Ajouter
  async function addItem() {
    const title = input.trim();
    if (!title || !me || !coupleId) return;
    setInput('');
    const maxPos = Math.max(-1, ...items.filter((i) => !i.is_done).map((i) => i.position ?? -1)) + 1;
    if (!navigator.onLine) {
      const { enqueueOutbox } = await import('@/lib/outbox');
      await enqueueOutbox('bucket_item', { title, couple_id: coupleId, author_id: me, position: maxPos });
      console.log('[offline] bucket item queued');
      return;
    }
    const { error } = await supabase.from('bucket_items').insert({
      title,
      couple_id: coupleId,
      author_id: me,
      position: maxPos,
    });

    if (error) {
      setInput(title);
      alert(error.message);
      return;
    }

    try {
      await fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketTitle: title,
          type: 'bucket',
        }),
      });
    } catch (err) {
      console.warn('Erreur lors de l’envoi de la notif:', err);
    }
  }

  // ✅ Toggle
  async function toggleItem(id: string, is_done: boolean) {
    const newVal = !is_done;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, is_done: newVal, done_at: newVal ? new Date().toISOString() : null } : i
      )
    );
    const { error } = await supabase
      .from('bucket_items')
      .update({ is_done: newVal, done_at: newVal ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) alert(error.message);
  }

  // 🗑️ Delete
  async function delItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from('bucket_items').delete().eq('id', id);
    if (error) alert(error.message);
  }

  return (
    <main
      style={
        {
          ['--nav-h' as any]: '64px', // hauteur de ta navbar
          ['--gap' as any]: '16px', // gap haut / bas
        } as React.CSSProperties
      }
      className={`
        w-full max-w-3xl mx-auto
        h-[100svh]
        overflow-hidden
        px-3 sm:px-4
        pt-[calc(env(safe-area-inset-top)+var(--gap))]
        pb-[calc(env(safe-area-inset-bottom)+96px)]
        flex flex-col
      `}
    >
      {/* === COMPOSER FIXE EN HAUT === */}
      <section
        className={`
          fixed top-[calc(env(safe-area-inset-top)+var(--gap))]
          left-0 right-0
          px-3 sm:px-4
          z-10
        `}
      >
        <div className="max-w-3xl mx-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-lg p-4 sm:p-5">
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
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black text-white dark:bg-white dark:text-black px-3 py-2 font-medium disabled:opacity-50 active:scale-95 transition"
              disabled={!input.trim()}
            >
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </div>
        </div>
      </section>

      <div className="px-3 sm:px-4 mt-[calc(var(--gap)*2+12px)] mb-2 max-w-3xl mx-auto text-xs opacity-70">
        Stats • À faire: {remaining} • Faits: {doneCount} • {percent}%
      </div>

      {/* === LISTE (scroll dans une box) === */}
      <section
        style={{ height: 'calc(100svh - (var(--gap) * 2 + 100px) - (env(safe-area-inset-bottom) + 96px))' }}
        className={`
          flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain
          mt-[calc(var(--gap)*2+100px)]  /* espace sous le composer */
          pb-[calc(env(safe-area-inset-bottom)+96px)]
          snap-y snap-mandatory
        `}
      >
        <ul className="space-y-2">
          {items.length === 0 ? (
            <li className="rounded-2xl border border-pink-200/30 dark:border-pink-900/30 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm p-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-1">💔</div>
                <p className="opacity-80">Rien à faire à deux ? Ajoutez une idée !</p>
              </div>
            </li>
          ) : (
            items
              .sort(
                (a, b) =>
                  Number(a.is_done) - Number(b.is_done) ||
                  (a.position ?? 0) - (b.position ?? 0) ||
                  a.created_at.localeCompare(b.created_at)
              )
              .map((item) => {
                const itemClasses = item.is_done
                  ? 'bg-white/40 dark:bg-neutral-800/40 border-black/10 dark:border-white/10'
                  : 'border-pink-200/20 dark:border-pink-900/25 bg-white/80 dark:bg-neutral-900/70';
                return (
                  <li
                    key={item.id}
                    className={`snap-start rounded-2xl shadow-sm p-4 sm:p-4 flex items-center justify-between gap-3 border backdrop-blur-md ${itemClasses}`}
                    onDragOver={(e) => {
                      if (!draggingId || item.is_done) return;
                      e.preventDefault();
                      if (draggingId === item.id) return;
                      setItems((prev) => reorderUndone(prev, draggingId, item.id));
                    }}
                    onDrop={(e) => {
                      if (!draggingId) return;
                      e.preventDefault();
                      setDraggingId(null);
                      void persistPositions();
                    }}
                  >
                    {!item.is_done && (
                      <button
                        className="shrink-0 p-1 rounded-lg cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/10"
                        draggable
                        aria-label="Réordonner"
                        onDragStart={() => setDraggingId(item.id)}
                        onDragEnd={() => { setDraggingId(null); void persistPositions(); }}
                      >
                        <GripVertical className="h-4 w-4 opacity-70" />
                      </button>
                    )}
                    <button
                      className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-transform active:scale-90"
                      onClick={() => toggleItem(item.id, item.is_done)}
                      aria-label={item.is_done ? 'Marquer non fait' : 'Marquer fait'}
                      title={item.is_done ? 'Marquer non fait' : 'Marquer fait'}
                    >
                      {item.is_done ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-pink-500" />
                      )}
                    </button>

                    <div className="flex-1">
                      <p className={`text-base sm:text-lg ${item.is_done ? 'line-through opacity-60' : ''}`}>
                        {item.title}
                      </p>
                      {item.is_done && item.done_at && (
                        <p className="text-xs opacity-60">
                          Fait le {new Date(item.done_at).toLocaleDateString()}
                        </p>
                      )}
                      {!item.is_done && convertFor?.id === item.id && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          <input
                            type="datetime-local"
                            value={convertAt}
                            onChange={(e) => setConvertAt(e.target.value)}
                            className="rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-2 py-1"
                          />
                          <label className="inline-flex items-center gap-1 text-xs opacity-80">
                            <input type="checkbox" checked={deleteAfterConvert} onChange={(e) => setDeleteAfterConvert(e.target.checked)} />
                            Supprimer après conversion
                          </label>
                          <button
                            onClick={async () => {
                              if (!me || !coupleId) return;
                              const dt = convertAt || new Date().toISOString().slice(0,16);
                              const starts_at = new Date(dt).toISOString();
                              const { error } = await supabase.from('couple_events').insert({
                                title: item.title,
                                starts_at,
                                ends_at: null,
                                notes: null,
                                author_id: me,
                                couple_id: coupleId,
                              });
                              if (error) { alert(error.message); return; }
                              setConvertFor(null);
                              try {
                                await fetch('/api/push/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'event', eventTitle: item.title, starts_at }) });
                              } catch {}
                              if (deleteAfterConvert) {
                                const { error: delErr } = await supabase.from('bucket_items').delete().eq('id', item.id);
                                if (delErr) console.warn('Suppression item après conversion a échoué', delErr.message);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            Créer l’évènement
                          </button>
                          <button onClick={() => setConvertFor(null)} className="text-xs opacity-70 hover:opacity-100">Annuler</button>
                        </div>
                      )}
                    </div>

                    <button
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10 transition active:scale-95"
                      onClick={() => delItem(item.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {!item.is_done && (
                      <button
                        onClick={() => {
                          setConvertFor({ id: item.id, title: item.title });
                          setConvertAt(new Date().toISOString().slice(0,16));
                        }}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10 transition"
                        aria-label="Convertir en évènement"
                        title="Convertir en évènement"
                      >
                        <CalendarPlus className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })
          )}
        </ul>
      </section>

      {/* hide scrollbar utility */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}
