'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import NoteCard, { type Note } from '@/components/notes/NoteCard';
import { Send } from 'lucide-react';

export default function NotesPage() {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const scrollerRef = useRef<HTMLDivElement>(null);

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

  // === 🔥 Abonnement Realtime universel ===
  useEffect(() => {
    const channel = supabase
      .channel('love_notes_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'love_notes' },
        (payload) => {
          const newNote = payload.new as Note & { couple_id: string };
          // on vérifie qu’elle appartient bien à ce couple
          if (newNote.couple_id !== coupleId) return;

          setNotes((prev) => {
            if (prev.find((n) => n.id === newNote.id)) return prev;
            return [newNote, ...prev];
          });

          requestAnimationFrame(() =>
            scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'love_notes' },
        (payload) => {
          const deleted = payload.old as Note & { couple_id: string };
          if (deleted.couple_id !== coupleId) return;
          setNotes((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const received = useMemo(
    () => notes.filter((n) => n.author_id !== me),
    [notes, me]
  );

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

    // ✅ Envoi de la notification push au partenaire
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
    <main className="max-w-3xl mx-auto">
      <div
        ref={scrollerRef}
        className="overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-3 sm:-mx-4 px-3 sm:px-4 pt-2 pb-6"
        style={{ scrollBehavior: 'smooth' }}
      >
        {received.length === 0 ? (
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-lg p-6 text-center">
            <p className="text-sm opacity-70">Aucun mot doux reçu pour l’instant 💌</p>
          </div>
        ) : (
          <div className="flex gap-4">
            {received.map((note) => (
              <div key={note.id} className="snap-center flex-[0_0_100%]">
                <NoteCard note={note} onDelete={deleteNote} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+84px)] sm:bottom-[calc(env(safe-area-inset-bottom)+96px)] z-10">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md shadow-lg p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Écris un mot doux…"
              className="flex-1 resize-none rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            />
            <button
              onClick={sendNote}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black text-white dark:bg-white dark:text-black px-3 py-2 font-medium disabled:opacity-50"
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
