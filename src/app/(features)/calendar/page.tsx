"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { CalendarPlus, Trash2, Clock3 } from "lucide-react";
import EventCard, { type CalendarEvent } from "@/components/calendar/EventCard";
import EventForm from "@/components/calendar/EventForm";

type EventRow = {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  notes: string | null;
  created_at: string;
  all_day?: boolean;
};

export default function CalendarPage() {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [items, setItems] = useState<EventRow[]>([]);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [allDay, setAllDay] = useState<boolean>(false);
  const params = useSearchParams();

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

      let list: EventRow[] | null = null;
      if (!navigator.onLine) {
        try {
          const cached = localStorage.getItem(`cache_events_${st.couple_id}`);
          if (cached) list = JSON.parse(cached);
        } catch {}
      }
      if (!list) {
        const { data } = await supabase
          .from('couple_events')
          .select('id, couple_id, author_id, title, starts_at, ends_at, notes, created_at, all_day')
          .eq('couple_id', st.couple_id)
          .gte('starts_at', new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString())
          .order('starts_at', { ascending: true });
        list = (data ?? []) as EventRow[];
        try { localStorage.setItem(`cache_events_${st.couple_id}`, JSON.stringify(list)); } catch {}
      }
      setItems(list ?? []);
    })();
  }, [router]);

  // Realtime universal (filter by couple_id client-side)
  useEffect(() => {
    const ch = supabase
      .channel('couple_events_all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'couple_events' }, (p) => {
        const row = p.new as EventRow;
        setItems(prev => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          if (prev.find(i => i.id === row.id)) return prev;
          return [...prev, row].sort((a,b) => a.starts_at.localeCompare(b.starts_at));
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'couple_events' }, (p) => {
        const row = p.new as EventRow;
        setItems(prev => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          const next = prev.map(i => i.id === row.id ? row : i);
          next.sort((a,b) => a.starts_at.localeCompare(b.starts_at));
          return next;
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'couple_events' }, (p) => {
        const row = p.old as EventRow;
        setItems(prev => {
          if (!coupleId || row.couple_id !== coupleId) return prev;
          return prev.filter(i => i.id !== row.id);
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [coupleId]);

  // Resync on tab visibility
  useEffect(() => {
    async function refetch() {
      if (!coupleId || document.hidden) return;
      const { data } = await supabase
        .from('couple_events')
        .select('id, couple_id, author_id, title, starts_at, ends_at, notes, created_at, all_day')
        .eq('couple_id', coupleId)
        .gte('starts_at', new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString())
        .order('starts_at', { ascending: true });
      const next = data ?? [];
      setItems(next);
      try { localStorage.setItem(`cache_events_${coupleId}`, JSON.stringify(next)); } catch {}
    }
    document.addEventListener('visibilitychange', refetch);
    return () => document.removeEventListener('visibilitychange', refetch);
  }, [coupleId]);

  async function addEvent() {
    const t = title.trim();
    if (!t || !start || !me || !coupleId) return;
    let starts_at = new Date(start).toISOString();
    let ends_at: string | null = end ? new Date(end).toISOString() : null;
    if (allDay) {
      const d = new Date(start);
      d.setHours(0, 0, 0, 0);
      starts_at = d.toISOString();
      ends_at = null;
    }
    if (!navigator.onLine) {
      const { enqueueOutbox } = await import('@/lib/outbox');
      await enqueueOutbox('event', {
        title: t,
        starts_at,
        ends_at,
        notes: notes.trim() || null,
        author_id: me,
        couple_id: coupleId,
        all_day: allDay,
      });
      console.log('[offline] event queued');
      setTitle(""); setStart(""); setEnd(""); setNotes("");
      return;
    }

    const { error } = await supabase.from('couple_events').insert({
      title: t,
      starts_at,
      ends_at,
      notes: notes.trim() || null,
      author_id: me,
      couple_id: coupleId,
      all_day: allDay,
    });
    if (error) { alert(error.message); return; }
    setTitle(""); setStart(""); setEnd(""); setNotes(""); setAllDay(false);

    try {
      await fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'event', eventTitle: t, starts_at }),
      });
    } catch (e) {
      console.warn('push notify failed', e);
    }
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from('couple_events').delete().eq('id', id);
    if (error) alert(error.message);
  }

  // Deeplink focus (?event=<id>)
  useEffect(() => {
    const target = params?.get('event');
    if (!target) return;
    const el = document.getElementById(`event-${target}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(target);
      const t = setTimeout(() => setHighlightId(null), 2500);
      return () => clearTimeout(t);
    }
  }, [params, items.length]);

  const grouped = useMemo(() => {
    // map by day, sorted
    const out = new Map<string, EventRow[]>();
    const today = new Date(); today.setHours(0,0,0,0);
    const sorted = [...items]
      .filter(i => new Date(i.starts_at).getTime() >= today.getTime() - 24*3600*1000)
      .sort((a,b) => a.starts_at.localeCompare(b.starts_at));
    for (const ev of sorted) {
      const d = new Date(ev.starts_at);
      const key = d.toISOString().slice(0,10);
      const arr = out.get(key) || [];
      arr.push(ev);
      out.set(key, arr);
    }
    return out;
  }, [items]);

  return (
    <main
      style={
        {
          ['--nav-h' as any]: '64px',
          ['--gap' as any]: '16px',
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
      {/* === FORMULAIRE STICKY TOP === */}
      <section
        className={`
          sticky top-[calc(env(safe-area-inset-top)+var(--gap))]
          z-10
        `}
      >
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-lg p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarPlus className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Ajouter un événement</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre"
              className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              Évènement sur une journée
            </label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Début"
              className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            />
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="Fin (optionnel)"
              className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optionnel)"
              className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            />
          </div>
          <div className="mt-3">
            <button
              onClick={addEvent}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black text-white dark:bg-white dark:text-black px-3 py-2 font-medium disabled:opacity-50 active:scale-95 transition"
              disabled={!title.trim() || !start}
            >
              Ajouter
            </button>
          </div>
        </div>
      </section>

      {/* === LISTE (scroll dans une box) === */}
      <section
        className={`
          flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain
          mt-8
          pb-[calc(env(safe-area-inset-bottom)+96px)]
        `}
      >
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([day, evs]) => (
            <div
              key={day}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow p-4"
            >
              {/* Date section */}
              <h2 className="text-[11px] uppercase tracking-wide opacity-70 mb-3">
                {new Date(day).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>

              {/* Events */}
              <ul className="space-y-3">
                {evs.map((ev) => (
                  <li key={ev.id} className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{ev.title}</p>
                      <p className="text-xs opacity-70 flex items-center gap-1 mt-0.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>
                          {new Date(ev.starts_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {ev.ends_at
                            ? ` → ${new Date(ev.ends_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`
                            : ''}
                        </span>
                      </p>
                      {ev.notes && (
                        <p className="italic text-sm opacity-60 mt-1">{ev.notes}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        className="rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
                        title="Éditer"
                        onClick={() => setEditing(ev)}
                      >
                        ✏️
                      </button>
                      <button
                        className="rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
                        title="Supprimer"
                        onClick={() => deleteEvent(ev.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {grouped.size === 0 && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow p-6 text-center">
              <div className="text-2xl mb-1">🗓️</div>
              <p className="text-sm opacity-80">
                Aucun événement prévu. Ajoutez-en un pour planifier à deux !
              </p>
            </div>
          )}
        </div>
      </section>

      {/* util scrollbar */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {editing && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
          <EventForm
            initial={{
              id: editing.id,
              title: editing.title,
              starts_at: editing.starts_at,
              ends_at: editing.ends_at,
              notes: editing.notes || '',
              all_day: !!editing.all_day,
              couple_id: coupleId!,
              author_id: me!,
            }}
            onCancel={() => setEditing(null)}
            onSubmit={async (vals) => {
              setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...vals, starts_at: vals.starts_at, ends_at: vals.ends_at, all_day: vals.all_day } as any : i));
              setEditing(null);
              const { error } = await supabase.from('couple_events').update({
                title: vals.title,
                starts_at: vals.starts_at,
                ends_at: vals.ends_at,
                notes: vals.notes,
                all_day: vals.all_day,
              }).eq('id', editing.id);
              if (error) alert(error.message);
            }}
          />
        </div>
      )}    
    </main>
  );
}    
