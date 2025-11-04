import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SectionProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: SectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2> : null}
            {description ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
        </div>
      )}
      <div className={cn('space-y-3', contentClassName)}>{children}</div>
    </section>
  )
}
