'use client';

import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';

export type Note = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
};

export default function NoteCard({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: (id: string) => void;
}) {
  // seed légère basée sur l'id pour stabilité visuelle
  const variants = useMemo(() => {
    const n = note.id.charCodeAt(0) % 3; // 0..2
    const shapes = ['note-squiggle-1', 'note-squiggle-2', 'note-squiggle-3'];
    const rots   = ['rot-1', 'rot-2', 'rot-3'];
    const hands  = ['hand-1', 'hand-2', 'hand-3'];
    return {
      shape: shapes[n],
      rot: rots[(n + 1) % 3],
      hand: hands[(n + 2) % 3],
    };
  }, [note.id]);

  return (
    <div
      className={`note-card ${variants.shape} ${variants.rot} ${variants.hand}
        relative mx-auto w-[92%] sm:w-[85%] max-w-[700px]
        rounded-3xl border border-black/10 dark:border-white/10
        bg-white/80 dark:bg-neutral-900/70 backdrop-blur-md p-5 sm:p-6
      `}
      style={{ ['--tape-rot' as any]: ['-2deg','1deg','-1deg'][note.id.charCodeAt(1)%3] }}
    >
      <p className="whitespace-pre-wrap text-lg leading-relaxed">
        {note.content}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs opacity-60">
        <span>Reçu le {new Date(note.created_at).toLocaleDateString()}</span>
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 hover:border-black/10 hover:bg-black/5 dark:hover:bg-white/10"
          onClick={() => onDelete(note.id)}
          aria-label="Supprimer ce mot doux"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>
    </div>
  );
}
