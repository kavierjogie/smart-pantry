import { cookies } from 'next/headers'
import { Sidebar, MobileNav } from '@/components/navigation'
import { DEMO_COOKIE } from '@/lib/demo'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = (await cookies()).has(DEMO_COOKIE)
  return (
    <div className="flex min-h-screen">
      <Sidebar demo={demo} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav demo={demo} />
        <main className="flex-1 p-4 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
