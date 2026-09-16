import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Profile> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}
