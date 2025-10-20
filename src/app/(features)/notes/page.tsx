'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import NoteCard, { type Note, NoteStack } from '@/components/notes/NoteCard';
import { Send } from 'lucide-react';

export default function NotesPage() {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');

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

      const { data: rows } = await supabase
        .from('love_notes')
        .select('id, content, created_at, author_id, couple_id')
        .eq('couple_id', st.couple_id)
        .order('created_at', { ascending: false });

      setNotes(rows ?? []);
    })();
  }, [router]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('love_notes_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'love_notes' },
        (payload) => {
          const n = payload.new as Note & { couple_id: string };
          if (n.couple_id !== coupleId) return;
          setNotes((prev) => (prev.find((x) => x.id === n.id) ? prev : [n, ...prev]));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'love_notes' },
        (payload) => {
          const d = payload.old as Note & { couple_id: string };
          if (d.couple_id !== coupleId) return;
          setNotes((prev) => prev.filter((x) => x.id !== d.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const received = useMemo(() => notes.filter((n) => n.author_id !== me), [notes, me]);

  async function sendNote() {
    const content = input.trim();
    if (!content || !me || !coupleId) return;
    setInput('');
    const { error } = await supabase.from('love_notes').insert({
      couple_id: coupleId,
      author_id: me,
      content,
    });
    if (error) {
      setInput(content);
      alert(error.message);
      return;
    }
    try {
      await fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notePreview: content }),
      });
    } catch (err) {
      console.warn('Erreur lors de l’envoi de la notif:', err);
    }
  }

  async function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from('love_notes').delete().eq('id', id);
    if (error) alert(error.message);
  }

  return (
    <main
      // RÉGLAGES UI
      style={
        {
          ['--composer-h' as any]: 'clamp(96px, 22svh, 200px)',
          ['--app-nav-h' as any]: '64px',
          ['--gap' as any]: '24px',
        } as React.CSSProperties
      }
      className={`
        w-full max-w-none mx-auto
        min-h-[100svh]
        px-0
        overflow-hidden
        pb-[calc(env(safe-area-inset-bottom)+var(--app-nav-h)+var(--gap))]
      `}
    >
      {/* SCROLL NOTES */}
      <section
        className={`
          w-full
          h-[calc(100svh-var(--composer-h)-var(--app-nav-h)-var(--gap)-env(safe-area-inset-bottom))]
        `}
      >
        {received.length === 0 ? (
          <div className="mx-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-lg p-6 text-center">
            <p className="text-sm opacity-70">Aucun mot doux reçu pour l’instant 💌</p>
          </div>
        ) : (
          <NoteStack
            className={`
              h-full w-full
              overflow-y-auto overflow-x-hidden no-scrollbar
              rounded-none
            `}
          >
            {received.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={deleteNote} />
            ))}
          </NoteStack>
        )}
      </section>

      {/* COMPOSER sticky au-dessus de la navbar */}
      <section
        className={`
          fixed left-0 right-0
          bottom-[calc(env(safe-area-inset-bottom)+var(--app-nav-h)+24px)]
          px-3 sm:px-4
        `}
        style={{ height: 'var(--composer-h)' }}
      >
        <div className="h-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/75 dark:bg-neutral-900/70 backdrop-blur-xl shadow-lg">
          <div className="flex h-full flex-col p-3 sm:p-4">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écris un mot doux…"
                className={`
                  w-full h-full
                  resize-none
                  rounded-xl
                  border border-black/10 dark:border-white/10
                  bg-transparent
                  px-3 py-2
                  outline-none
                  focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10
                `}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={sendNote}
                disabled={!input.trim()}
                className={`
                  inline-flex items-center gap-2
                  rounded-xl border border-black/10 dark:border-white/10
                  bg-black text-white dark:bg-white dark:text-black
                  px-3 py-2 font-medium
                  disabled:opacity-50
                  active:scale-95 transition
                `}
              >
                <Send className="h-4 w-4" />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* util pour masquer la barre de scroll + affiner le padding du stack */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Override padding ScrollStack pour mobile/iPad */
        .scroll-stack-inner {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
          padding-top: 12vh !important;
          padding-bottom: 28rem !important;
        }
        @media (min-width: 640px) {
          .scroll-stack-inner {
            padding-left: 1.25rem !important;
            padding-right: 1.25rem !important;
            padding-top: 14vh !important;
          }
        }
      `}</style>
    </main>
  );
}
