'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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

const BUCKET_CHANNEL = 'bucket_items_all';
const CACHE_PREFIX = 'cache_bucket_';

export default function BucketPage() {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [convertFor, setConvertFor] = useState<{ id: string; title: string } | null>(null);
  const [convertAt, setConvertAt] = useState('');
  const [deleteAfterConvert, setDeleteAfterConvert] = useState(true);
  const [allDay, setAllDay] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data: sessionResult } = await supabase.auth.getSession();
      if (!sessionResult.session) {
        router.replace('/register');
        return;
      }

      const userId = sessionResult.session.user.id;
      setMe(userId);

      const { data: status } = await supabase
        .from('my_couple_status')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!status) {
        router.replace('/onboarding');
        return;
      }

      if (status.members_count < 2) {
        router.replace('/waiting');
        return;
      }

      setCoupleId(status.couple_id);

      let list: Item[] | null = null;

      if (!navigator.onLine) {
        try {
          const cached = localStorage.getItem(`${CACHE_PREFIX}${status.couple_id}`);
          if (cached) {
            list = JSON.parse(cached) as Item[];
          }
        } catch {
          // ignore cache parse errors
        }
      }

      if (!list) {
        const { data } = await supabase
          .from('bucket_items')
          .select('id, couple_id, author_id, title, is_done, done_at, created_at, position')
          .eq('couple_id', status.couple_id)
          .order('is_done', { ascending: true })
          .order('position', { ascending: true })
          .order('created_at', { ascending: true });

        list = (data ?? []) as Item[];

        try {
          localStorage.setItem(`${CACHE_PREFIX}${status.couple_id}`, JSON.stringify(list));
        } catch {
          // ignore cache write errors
        }
      }

      setItems(list ?? []);
    };

    void run();
  }, [router]);

  useEffect(() => {
    const channel = supabase
      .channel(BUCKET_CHANNEL)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bucket_items' }, (payload) => {
        const row = payload.new as Item;
        setItems((prev) => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          if (prev.some((item) => item.id === row.id)) return prev;
          return [...prev, row];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bucket_items' }, (payload) => {
        const row = payload.new as Item;
        setItems((prev) => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          return prev.map((item) => (item.id === row.id ? row : item));
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bucket_items' }, (payload) => {
        const row = payload.old as Item;
        setItems((prev) => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          return prev.filter((item) => item.id !== row.id);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  useEffect(() => {
    const refetch = async () => {
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

      try {
        localStorage.setItem(`${CACHE_PREFIX}${coupleId}`, JSON.stringify(next));
      } catch {
        // ignore cache write errors
      }
    };

    document.addEventListener('visibilitychange', refetch);
    return () => document.removeEventListener('visibilitychange', refetch);
  }, [coupleId]);

  const remaining = useMemo(() => items.filter((item) => !item.is_done).length, [items]);
  const doneCount = useMemo(() => items.filter((item) => item.is_done).length, [items]);
  const total = items.length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  const reorderUndone = (list: Item[], fromId: string, toId: string) => {
    const undone = list.filter((item) => !item.is_done);
    const others = list.filter((item) => item.is_done);
    const fromIdx = undone.findIndex((item) => item.id === fromId);
    const toIdx = undone.findIndex((item) => item.id === toId);
    if (fromIdx < 0 || toIdx < 0) return list;

    const nextUndone = [...undone];
    const [moved] = nextUndone.splice(fromIdx, 1);
    nextUndone.splice(toIdx, 0, moved);

    return [...nextUndone.map((item, idx) => ({ ...item, position: idx })), ...others];
  };

  const persistPositions = async () => {
    if (!coupleId) return;

    const undone = items.filter((item) => !item.is_done);
    await Promise.all(
      undone.map((item, idx) => {
        if ((item.position ?? idx) !== idx) {
          return supabase.from('bucket_items').update({ position: idx }).eq('id', item.id);
        }
        return Promise.resolve();
      })
    );
  };

  const addItem = async () => {
    const title = input.trim();
    if (!title || !me || !coupleId) return;

    setInput('');
    const maxPos = Math.max(-1, ...items.filter((item) => !item.is_done).map((item) => item.position ?? -1)) + 1;

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
        body: JSON.stringify({ bucketTitle: title, type: 'bucket' }),
      });
    } catch (err) {
      console.warn("Erreur lors de l'envoi de la notif:", err);
    }
  };

  const toggleItem = async (id: string, isDone: boolean) => {
    const newValue = !isDone;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_done: newValue, done_at: newValue ? new Date().toISOString() : null } : item
      )
    );

    const { error } = await supabase
      .from('bucket_items')
      .update({ is_done: newValue, done_at: newValue ? new Date().toISOString() : null })
      .eq('id', id);

    if (error) alert(error.message);
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    const { error } = await supabase.from('bucket_items').delete().eq('id', id);
    if (error) alert(error.message);
  };

  const containerStyle: CSSProperties = {
    '--gap': '16px',
    minHeight: 'calc(var(--viewport-height) - var(--nav-h))',
  };

  return (
    <main
      style={containerStyle}
      className="w-full max-w-3xl mx-auto min-h-screen min-h-[calc(var(--viewport-height)-var(--nav-h))] max-h-[calc(var(--viewport-height)-var(--nav-h))] px-3 sm:px-4 pt-[calc(env(safe-area-inset-top)+var(--gap))] pb-[calc(env(safe-area-inset-bottom)+var(--gap))] flex flex-col overflow-y-auto no-scrollbar"
    >
      <section className="fixed top-[calc(env(safe-area-inset-top)+var(--gap))] left-0 right-0 px-3 sm:px-4 z-10">
        <div className="max-w-3xl mx-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-lg p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Bucket list</h1>
            <span className="text-sm opacity-70">{remaining} à faire</span>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ajouter une idée à deux"
              className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            />
            <button
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black text-white dark:bg-white dark:text-black px-3 py-2 font-medium disabled:opacity-50 active:scale-95 transition"
              disabled={!input.trim()}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
        </div>
      </section>

      <div className="px-3 sm:px-4 mt-[calc(var(--gap)+8px)] mb-2 max-w-3xl mx-auto text-xs opacity-70">
        Stats — À faire: {remaining} — Faits: {doneCount} — {percent}%
      </div>

      <section className="flex-1 mt-[calc(var(--gap)+70px)] pb-8 snap-y snap-mandatory">
        <ul className="space-y-2">
          {items.length === 0 ? (
            <li className="rounded-2xl border border-pink-200/30 dark:border-pink-900/30 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-sm p-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-1">🧺</div>
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
                    data-bucket-id={item.id}
                    className={`snap-start rounded-2xl shadow-sm p-4 sm:p-4 flex items-center justify-between gap-3 border backdrop-blur-md ${itemClasses}`}
                    onDragOver={(event) => {
                      if (!draggingId || item.is_done) return;
                      event.preventDefault();
                      if (draggingId === item.id) return;
                      setItems((prev) => reorderUndone(prev, draggingId, item.id));
                    }}
                    onDrop={(event) => {
                      if (!draggingId) return;
                      event.preventDefault();
                      setDraggingId(null);
                      void persistPositions();
                    }}
                  >
                    {!item.is_done && (
                      <button
                        className="shrink-0 p-1 rounded-lg cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/10 touch-none"
                        draggable
                        aria-label="Réordonner"
                        onDragStart={() => setDraggingId(item.id)}
                        onDragEnd={() => {
                          setDraggingId(null);
                          void persistPositions();
                        }}
                        onPointerDown={(event) => {
                          if (event.pointerType !== 'touch') return;
                          event.preventDefault();
                          setDraggingId(item.id);

                          const handleMove = (moveEvent: PointerEvent) => {
                            const hoveredElement = document.elementFromPoint(
                              moveEvent.clientX,
                              moveEvent.clientY
                            ) as HTMLElement | null;

                            let node: HTMLElement | null = hoveredElement;
                            while (node && !node.dataset.bucketId) {
                              node = node.parentElement;
                            }

                            const overId = node?.dataset.bucketId;
                            if (overId && overId !== item.id) {
                              setItems((prev) => reorderUndone(prev, item.id, overId));
                            }
                          };

                          const handleUp = () => {
                            setDraggingId(null);
                            window.removeEventListener('pointermove', handleMove);
                            window.removeEventListener('pointerup', handleUp);
                            void persistPositions();
                          };

                          window.addEventListener('pointermove', handleMove);
                          window.addEventListener('pointerup', handleUp, { once: true });
                        }}
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
                        <p className="text-xs opacity-60">Fait le {new Date(item.done_at).toLocaleDateString()}</p>
                      )}
                    </div>

                    <button
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10 transition active:scale-95"
                      onClick={() => deleteItem(item.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {!item.is_done && (
                      <button
                        onClick={() => {
                          setConvertFor({ id: item.id, title: item.title });
                          setConvertAt(new Date().toISOString().slice(0, 16));
                          setAllDay(false);
                        }}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10 transition"
                        aria-label="Convertir en événement"
                        title="Convertir en événement"
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

      {convertFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-5 shadow-xl">
            <h3 className="text-lg font-semibold mb-1">Ajouter au calendrier</h3>
            <p className="text-sm opacity-70 mb-4">{convertFor.title}</p>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm opacity-70">Quand</span>
                <input
                  type="datetime-local"
                  value={convertAt}
                  onChange={(event) => setConvertAt((event.target as HTMLInputElement).value)}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5"
                />
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />
                Toute la journée
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deleteAfterConvert}
                  onChange={(event) => setDeleteAfterConvert(event.target.checked)}
                />
                Supprimer l'élément après conversion
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConvertFor(null)} className="rounded-xl px-3 py-2 border border-black/10 dark:border-white/10">
                Annuler
              </button>
              <button
                className="rounded-xl px-3 py-2 bg-black text-white dark:bg-white dark:text-black"
                onClick={async () => {
                  if (!me || !coupleId || !convertFor) return;

                  let startsAt = new Date(convertAt || new Date().toISOString().slice(0, 16)).toISOString();

                  if (allDay) {
                    const day = new Date(convertAt || new Date());
                    day.setHours(0, 0, 0, 0);
                    startsAt = day.toISOString();
                  }

                  const { error } = await supabase.from('couple_events').insert({
                    title: convertFor.title,
                    starts_at: startsAt,
                    ends_at: null,
                    notes: null,
                    author_id: me,
                    couple_id: coupleId,
                    all_day: allDay,
                  });

                  if (error) {
                    alert(error.message);
                    return;
                  }

                  setConvertFor(null);

                  try {
                    await fetch('/api/push/notify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'event',
                        eventTitle: convertFor.title,
                        starts_at: startsAt,
                      }),
                    });
                  } catch {
                    // ignore push errors
                  }

                  if (deleteAfterConvert) {
                    const { error: deleteError } = await supabase.from('bucket_items').delete().eq('id', convertFor.id);
                    if (deleteError) {
                      console.warn("Suppression de l'item après conversion échouée", deleteError.message);
                    }
                  }
                }}
              >
                Créer l'événement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* util scrollbar - already defined globally in globals.css */}
    </main>
  );
}
