'use client';

import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import ScrollStack, { ScrollStackItem } from './ScrollStack';

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
  // Derivations UI only
  const { title, body } = useMemo(() => {
    const lines = (note?.content || '').split('\n');
    const t = (lines[0] || '').trim();
    const b = lines.slice(1).join('\n').trim();
    return { title: t.length > 0 ? t : 'Sans titre', body: b.length > 0 ? b : undefined };
  }, [note?.content]);

  const dateLabel = useMemo(() => {
    try {
      const d = new Date(note.created_at);
      return d.toLocaleDateString();
    } catch {
      return note.created_at;
    }
  }, [note.created_at]);

  return (
    <ScrollStackItem
      itemClassName={`
        bg-white/80 dark:bg-neutral-900/70
        backdrop-blur-md
        border border-black/5 dark:border-white/10
        shadow-lg shadow-pink-500/10
        relative overflow-hidden
        transition-all duration-300
        hover:shadow-xl hover:-translate-y-0.5
      `}
    >
      {/* gradient d'ambiance */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent"
        aria-hidden
      />

      <article className="relative flex h-full w-full flex-col">
        {/* Header */}
        <header className="mb-3">
          <h3 className="text-xl font-semibold tracking-tight line-clamp-2">
            {title}
          </h3>
        </header>

        {/* Body */}
        <div className="prose prose-sm dark:prose-invert max-w-none grow whitespace-pre-wrap">
          {body ? body : <p className="opacity-70 italic">Aucun contenu supplémentaire…</p>}
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between text-xs opacity-70">
          <span>Reçu le {dateLabel}</span>

          <button
            onClick={() => onDelete(note.id)}
            aria-label="Supprimer cette note"
            className="inline-flex items-center gap-1 rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </article>
    </ScrollStackItem>
  );
}

/** Optionnel: wrapper pratique */
export function NoteStack({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ScrollStack
      className={`overflow-x-hidden w-full h-[80vh] ${className}`}
      itemDistance={100}
      itemScale={0.03}
      itemStackDistance={30}
      stackPosition="20%"
      scaleEndPosition="10%"
      baseScale={0.85}
      rotationAmount={0}
      blurAmount={0.75}
      useWindowScroll={false}
    >
      {children}
    </ScrollStack>
  );
}
