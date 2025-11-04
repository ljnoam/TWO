// src/components/notes/NotesCarousel.tsx
'use client';

import { FiFileText } from 'react-icons/fi';
import Carousel, { type CarouselItem } from '@/components/ui/Carousel';

function noteToItem(n: Note, idx: number): CarouselItem {
  const lines = (n.content || '').split('\n');
  const title = (lines[0] || '').trim() || 'Sans titre';
  const description = lines.slice(1).join('\n').trim() || '—';
  return {
    id: idx,
    title,
    description,
    icon: <FiFileText className="h-[16px] w-[16px] text-white" />,
  };
}

export default function NotesCarousel({ notes }: { notes: Note[] }) {
  const items = notes.map(noteToItem);
  return (
    <div className="relative w-full flex justify-center">
      <Carousel
        items={items}
        baseWidth={300}
        autoplay={false}
        pauseOnHover
        loop={notes.length > 1}
        round={false}
      />
    </div>
  );
}
