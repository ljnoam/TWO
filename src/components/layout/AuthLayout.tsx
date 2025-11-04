import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen min-h-[var(--viewport-height)] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-indigo-50 px-4 py-10 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/60 to-transparent dark:from-neutral-900/70" aria-hidden />
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70">
        {children}
      </div>
    </div>
  )
}
