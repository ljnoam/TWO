import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
}

export function PageLayout({ children, as: Component = 'main', className }: PageLayoutProps) {
  return (
    <Component
      className={cn(
        'mx-auto flex w-full max-w-3xl flex-col gap-6 px-1 pb-16 sm:gap-7 sm:px-0',
        'min-h-[calc(var(--viewport-height)-var(--gap))]',
        className
      )}
    >
      {children}
    </Component>
  )
}
