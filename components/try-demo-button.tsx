'use client'

import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { enterDemo } from '@/lib/demo'

export function TryDemoButton() {
  const router = useRouter()

  function handleClick() {
    enterDemo()
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className="group w-full gap-2 border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
      >
        <Sparkles className="h-4 w-4" />
        Try the demo
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Button>
      <p className="text-center text-xs text-slate-400">No sign-up needed · explore with a sample pantry</p>
    </div>
  )
}
