'use client';

import React, { useMemo, useState } from 'react';
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
  sent = false,
  reactionCounts,
  myReaction,
  onToggleReaction,
}: {
  note: Note;
  onDelete: (id: string) => void;
  sent?: boolean;
  reactionCounts?: Record<'❤️' | '😆' | '🥲', number>;
  myReaction?: '❤️' | '😆' | '🥲' | null;
  onToggleReaction?: (emoji: '❤️' | '😆' | '🥲') => void;
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
      return d.toLocaleDateString('fr-FR');
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

        {/* Reactions + footer */}
        <div className="mt-5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-800/60 px-2 py-1">
            {(['❤️', '😆', '🥲'] as const).map((e) => {
              const active = myReaction === e;
              const count = reactionCounts?.[e] ?? 0;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => onToggleReaction && onToggleReaction(e)}
                  aria-pressed={active}
                  aria-label={`Réagir ${e}`}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/40 ${active ? 'bg-pink-100/70 text-pink-700 dark:bg-pink-900/30 dark:text-pink-200' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                >
                  <span>{e}</span>
                  <span className="text-xs opacity-70 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs opacity-70 inline-flex items-center gap-3">
            <span>{sent ? 'Envoyé le' : 'Reçu le'} {dateLabel}</span>
            <button
              onClick={() => onDelete(note.id)}
              aria-label="Supprimer cette note"
              className="inline-flex items-center gap-1 rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          </div>
        </div>
      </article>
    </ScrollStackItem>
  );
}

/** Wrapper pratique avec pagination dots */
export function NoteStack({
  children,
  className = '',
  showDots = true,
}: {
  children: React.ReactNode;
  className?: string;
  showDots?: boolean;
}) {
  const total = React.Children.count(children);
  const [active, setActive] = useState(0);
  return (
    <div className={`relative overflow-hidden w-full h-[80vh] ${className}`}>
      <ScrollStack
        className={`overflow-x-hidden w-full h-full`}
        itemDistance={90}
        itemScale={0.035}
        itemStackDistance={30}
        stackPosition="20%"
        scaleEndPosition="10%"
        baseScale={0.86}
        rotationAmount={0}
        blurAmount={1.0}
        useWindowScroll={false}
        onActiveIndexChange={(i) => setActive(i)}
      >
        {children}
      </ScrollStack>

      {showDots && total > 1 && (
        <div className="pointer-events-none absolute left-0 right-0 bottom-6 flex items-center justify-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`${i === active ? 'w-3 bg-pink-500' : 'w-2 bg-black/20 dark:bg-white/20'} h-2 rounded-full transition-all`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

