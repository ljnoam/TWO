'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { setAppBadge } from '@/lib/badging';
import NoteCard, { type Note, NoteStack } from '@/components/notes/NoteCard';
import { Send } from 'lucide-react';

type Reaction = { id: string; note_id: string; user_id: string; emoji: '❤️'|'😆'|'🥲'; created_at: string };

export default function NotesPage() {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reactionsByNote, setReactionsByNote] = useState<Record<string, Reaction[]>>({});
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<'received' | 'sent'>('received');

  // Charge user + couple
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

      let rows: any[] | null = null;
      if (!navigator.onLine) {
        try {
          const cached = localStorage.getItem(`cache_notes_${st.couple_id}`);
          if (cached) rows = JSON.parse(cached);
        } catch {}
      }

      if (!rows) {
        const resp = await supabase
          .from('love_notes')
          .select('id, content, created_at, author_id, couple_id')
          .eq('couple_id', st.couple_id)
          .order('created_at', { ascending: false });
        rows = resp.data ?? [];
        try { localStorage.setItem(`cache_notes_${st.couple_id}`, JSON.stringify(rows)); } catch {}
      }

      const list = rows ?? [];
      setNotes(list);

      const ids = list.map((n) => n.id);
      if (ids.length > 0) {
        const { data: reacts } = await supabase
          .from('note_reactions')
          .select('id, note_id, user_id, emoji, created_at')
          .in('note_id', ids);
        const by: Record<string, Reaction[]> = {};
        (reacts ?? []).forEach((r) => { (by[r.note_id] ||= []).push(r as Reaction); });
        setReactionsByNote(by);
      } else {
        setReactionsByNote({});
      }
    })();
  }, [router]);

  // Realtime for notes + reactions
  useEffect(() => {
    const channel = supabase
      .channel('love_notes_all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'love_notes' }, (payload) => {
        const n = payload.new as Note & { couple_id: string };
        if (n.couple_id !== coupleId) return;
        setNotes((prev) => (prev.find((x) => x.id === n.id) ? prev : [n, ...prev]));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'love_notes' }, (payload) => {
        const d = payload.old as Note & { couple_id: string };
        if (d.couple_id !== coupleId) return;
        setNotes((prev) => prev.filter((x) => x.id !== d.id));
        setReactionsByNote((prev) => { const next = { ...prev }; delete next[d.id]; return next; });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'note_reactions' }, (payload) => {
        const r = payload.new as Reaction;
        setReactionsByNote((prev) => {
          const has = notes.find((n) => n.id === r.note_id);
          if (!has) return prev;
          const arr = (prev[r.note_id] ?? []).filter((x) => x.user_id !== r.user_id);
          return { ...prev, [r.note_id]: [...arr, r] };
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'note_reactions' }, (payload) => {
        const r = payload.new as Reaction;
        setReactionsByNote((prev) => {
          const has = notes.find((n) => n.id === r.note_id);
          if (!has) return prev;
          const arr = (prev[r.note_id] ?? []).filter((x) => x.user_id !== r.user_id);
          return { ...prev, [r.note_id]: [...arr, r] };
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'note_reactions' }, (payload) => {
        const r = payload.old as Reaction;
        setReactionsByNote((prev) => {
          const arr = prev[r.note_id];
          if (!arr) return prev;
          return { ...prev, [r.note_id]: arr.filter((x) => x.id !== r.id) };
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [coupleId, notes]);

  const received = useMemo(() => notes.filter((n) => n.author_id !== me), [notes, me]);
  const sent = useMemo(() => notes.filter((n) => n.author_id === me), [notes, me]);

  // Update app badge (Android) with count of received notes
  useEffect(() => {
    try { setAppBadge(received.length); } catch {}
  }, [received.length]);

  // Visibility resync
  useEffect(() => {
    async function refetch() {
      if (!coupleId || document.hidden) return;
      const { data: list } = await supabase
        .from('love_notes')
        .select('id, content, created_at, author_id, couple_id')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      setNotes(list ?? []);
      const ids = (list ?? []).map((n) => n.id);
      if (ids.length > 0) {
        const { data: reacts } = await supabase
          .from('note_reactions')
          .select('id, note_id, user_id, emoji, created_at')
          .in('note_id', ids);
        const by: Record<string, Reaction[]> = {};
        (reacts ?? []).forEach((r) => { (by[r.note_id] ||= []).push(r as Reaction); });
        setReactionsByNote(by);
      } else {
        setReactionsByNote({});
      }
    }
    document.addEventListener('visibilitychange', refetch);
    return () => document.removeEventListener('visibilitychange', refetch);
  }, [coupleId]);

  async function sendNote() {
    const content = input.trim();
    if (!content || !me || !coupleId) return;
    setInput('');
    if (!navigator.onLine) {
      const { enqueueOutbox } = await import('@/lib/outbox');
      await enqueueOutbox('love_note', { couple_id: coupleId, author_id: me, content });
      console.log('[offline] note queued');
      // Optional: optimistic UI can be added here if desired
      return;
    }
    const { error } = await supabase.from('love_notes').insert({ couple_id: coupleId, author_id: me, content });
    if (error) { setInput(content); alert(error.message); return; }
    try {
      await fetch('/api/push/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notePreview: content }) });
    } catch (err) { console.warn('Erreur lors de lenvoi de la notif:', err); }
  }

  async function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from('love_notes').delete().eq('id', id);
    if (error) alert(error.message);
  }

  function reactionCountsFor(noteId: string): Record<'❤️'|'😆'|'🥲', number> {
    const arr = reactionsByNote[noteId] ?? [];
    return {
      '❤️': arr.filter((r) => r.emoji === '❤️').length,
      '😆': arr.filter((r) => r.emoji === '😆').length,
      '🥲': arr.filter((r) => r.emoji === '🥲').length,
    };
  }

  function myReactionFor(noteId: string): '❤️'|'😆'|'🥲'|null {
    const arr = reactionsByNote[noteId] ?? [];
    const r = arr.find((x) => x.user_id === me);
    return (r?.emoji as any) || null;
  }

  async function toggleReaction(noteId: string, emoji: '❤️'|'😆'|'🥲') {
    if (!me) return;
    const current = myReactionFor(noteId);
    if (current === emoji) {
      setReactionsByNote((prev) => ({ ...prev, [noteId]: (prev[noteId] ?? []).filter((r) => r.user_id !== me) }));
      const { error } = await supabase.from('note_reactions').delete().match({ note_id: noteId, user_id: me });
      if (error) console.warn('Failed to remove reaction', error.message);
    } else {
      setReactionsByNote((prev) => {
        const others = (prev[noteId] ?? []).filter((r) => r.user_id !== me);
        const optimistic: Reaction = { id: `tmp-${noteId}-${me}`, note_id: noteId, user_id: me, emoji, created_at: new Date().toISOString() };
        return { ...prev, [noteId]: [...others, optimistic] };
      });
      const { error } = await supabase.from('note_reactions').upsert({ note_id: noteId, user_id: me, emoji }, { onConflict: 'note_id,user_id' });
      if (error) console.warn('Failed to upsert reaction', error.message);
    }
  }

  return (
    <main
      style={{ ['--composer-h' as any]: 'clamp(96px, 22svh, 200px)', ['--app-nav-h' as any]: '64px', ['--gap' as any]: '24px' } as React.CSSProperties}
      className={`w-full max-w-none mx-auto min-h-[100svh] px-0 overflow-hidden pb-[calc(env(safe-area-inset-bottom)+var(--app-nav-h)+var(--gap))]`}
    >
      {/* TABS */}
      <div className="px-3 sm:px-4 pt-3">
        <div role="tablist" aria-label="Onglets notes" className="inline-flex rounded-full border border-black/10 dark:border-white/10 p-1 bg-white/70 dark:bg-neutral-900/60 shadow">
          <button role="tab" aria-selected={tab==='received'} onClick={() => setTab('received')} className={`px-3 py-1.5 rounded-full text-sm font-medium ${tab==='received' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>Reçues</button>
          <button role="tab" aria-selected={tab==='sent'} onClick={() => setTab('sent')} className={`px-3 py-1.5 rounded-full text-sm font-medium ${tab==='sent' ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>Envoyées</button>
        </div>
      </div>

      {/* SCROLL NOTES */}
      <section className={`w-full h-[calc(100svh-var(--composer-h)-var(--app-nav-h)-var(--gap)-env(safe-area-inset-bottom))]`}>
        {(tab === 'received' ? received : sent).length === 0 ? (
          <div className="mx-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-lg p-6 text-center">
            <p className="text-sm opacity-70">{tab==='received' ? "Aucun mot doux reçu pour l'instant" : "Vous n'avez pas encore envoyé de mot doux"}</p>
          </div>
        ) : (
          <NoteStack className={`h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar rounded-none`}>
            {(tab==='received' ? received : sent).map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onDelete={deleteNote}
                sent={tab==='sent'}
                reactionCounts={reactionCountsFor(note.id)}
                myReaction={myReactionFor(note.id)}
                onToggleReaction={(emoji) => toggleReaction(note.id, emoji)}
              />
            ))}
          </NoteStack>
        )}
      </section>

      {/* COMPOSER sticky au-dessus de la navbar */}
      <section className={`fixed left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)+var(--app-nav-h)+24px)] px-3 sm:px-4`} style={{ height: 'var(--composer-h)' }}>
        <div className="h-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/75 dark:bg-neutral-900/70 backdrop-blur-xl shadow-lg">
          <div className="flex h-full flex-col p-3 sm:p-4">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écris un mot doux…"
                className={`w-full h-full resize-none rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10`}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button onClick={sendNote} disabled={!input.trim()} className={`inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black text-white dark:bg-white dark:text-black px-3 py-2 font-medium disabled:opacity-50 active:scale-95 transition`}>
                <Send className="h-4 w-4" />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* util pour masquer la barre de scroll + affiner le padding du stack */}
      <style jsx global>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .scroll-stack-inner { padding-left: 1rem !important; padding-right: 1rem !important; padding-top: 12vh !important; padding-bottom: 28rem !important; }
        @media (min-width: 640px) { .scroll-stack-inner { padding-left: 1.25rem !important; padding-right: 1.25rem !important; padding-top: 14vh !important; } }
      `}</style>
    </main>
  );
}
