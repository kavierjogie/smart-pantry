import * as React from 'react'
import { cn } from '@/lib/utils'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean
}

export const TogglePill = React.forwardRef<HTMLButtonElement, Props>(
  ({ active, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize',
        active
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300',
        className
      )}
      {...props}
    />
  )
)
TogglePill.displayName = 'TogglePill'
