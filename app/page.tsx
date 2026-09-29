import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DEMO_COOKIE } from '@/lib/demo'

export default async function Home() {
  if ((await cookies()).has(DEMO_COOKIE)) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/auth/login')
  }
}
