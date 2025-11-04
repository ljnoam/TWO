import type { ReactNode } from 'react'

import MainNav from './MainNav'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen min-h-[var(--viewport-height)] flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.25),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(199,210,254,0.2),_transparent_55%)]"
      />
      <main
        className={cn(
          'flex-1 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+var(--gap))]',
          className
        )}
      >
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          {children}
        </div>
      </main>
      <MainNav />
    </div>
  )
}
