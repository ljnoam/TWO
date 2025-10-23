import type { CSSProperties, ReactNode } from 'react';
import MainNav from '@/components/nav/MainNav';

const NAV_HEIGHT = '96px';

export default function FeaturesLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen min-h-[var(--viewport-height)] bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50"
      style={{ '--nav-h': NAV_HEIGHT } as CSSProperties}
    >
      <div className="px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+var(--nav-h)+16px)] max-w-3xl mx-auto">
        {children}
      </div>
      <MainNav />
    </div>
  );
}
