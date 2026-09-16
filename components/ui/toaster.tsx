'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border shadow-md',
          success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
          error: 'border-red-200 bg-red-50 text-red-900',
        },
      }}
    />
  )
}

export { toast } from 'sonner'
