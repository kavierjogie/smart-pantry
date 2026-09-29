import { createClient } from '@/lib/supabase/client'
import { isDemoMode, DEMO_USER } from '@/lib/demo'

// Single entry point for "who is signed in" on the client: demo sessions never touch Supabase.
export async function getCurrentUser(): Promise<{ id: string; email?: string } | null> {
  if (isDemoMode()) return DEMO_USER
  const { data: { user } } = await createClient().auth.getUser()
  return user
}
