import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-3xl border border-black/10 bg-white/70 p-8 text-center shadow-md backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70',
        className
      )}
    >
      {icon ? <div className="text-3xl" aria-hidden>{icon}</div> : null}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  )
}
