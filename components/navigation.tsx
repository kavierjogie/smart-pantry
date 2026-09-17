'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, BookOpen, ShoppingCart,
  MessageSquare, BarChart3, Library, LogOut, ChefHat, Menu, X, UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pantry', label: 'Pantry', icon: Package },
  { href: '/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/shopping', label: 'Shopping List', icon: ShoppingCart },
  { href: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/cookbooks', label: 'Cookbooks', icon: Library },
  { href: '/profile', label: 'Profile', icon: UserCircle },
]

function NavLink({ href, label, icon: Icon, onClick }: {
  href: string; label: string; icon: React.ElementType; onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-emerald-600' : 'text-slate-400')} />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    toast.success('Signed out successfully')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r bg-white px-4 py-6">
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <ChefHat className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Smart Pantry</p>
          <p className="text-xs text-slate-500">Recipe Assistant</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {links.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </nav>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors mt-4"
      >
        <LogOut className="h-5 w-5 shrink-0 text-slate-400" />
        Sign out
      </button>
    </aside>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    toast.success('Signed out successfully')
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ChefHat className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Smart Pantry</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setOpen(false)}>
          <nav
            className="absolute left-0 top-14 bottom-0 w-64 bg-white px-4 py-4 flex flex-col gap-1 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {links.map((link) => (
              <NavLink key={link.href} {...link} onClick={() => setOpen(false)} />
            ))}
            <div className="mt-auto pt-4 border-t">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5 shrink-0 text-slate-400" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
