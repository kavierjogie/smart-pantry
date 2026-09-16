'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChefHat, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-emerald-600 p-12">
        <div className="max-w-sm text-white space-y-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <ChefHat className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Smart Pantry</h1>
              <p className="text-emerald-200 text-sm">Recipe Assistant</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold leading-tight">
            Cook smarter, waste less.
          </h2>
          <p className="text-emerald-100 text-lg leading-relaxed">
            Track what you have, discover what you can make, and get AI-powered meal suggestions tailored to your pantry.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: 'Pantry tracking', desc: 'Never forget what you have' },
              { label: 'Recipe matching', desc: 'Cook with what you own' },
              { label: 'AI assistant', desc: 'Personalised meal ideas' },
              { label: 'Reduce waste', desc: 'Expiry alerts & suggestions' },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 rounded-xl p-3">
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-emerald-200 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ChefHat className="h-5 w-5" />
            </div>
            <span className="font-semibold text-slate-900">Smart Pantry</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1">Sign in to your pantry</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            No account?{' '}
            <Link href="/auth/signup" className="text-emerald-600 font-medium hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
