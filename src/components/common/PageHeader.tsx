import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  children?: ReactNode
}

export function PageHeader({ title, description, actions, className, children }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="space-y-1">
        {title ? (
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        ) : null}
        {description ? <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
    </header>
  )
}
