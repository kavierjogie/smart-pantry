'use client'

import { useEffect, useState, useCallback } from 'react'
import { User, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { getProfile, upsertProfile } from '@/lib/db/profile'
import { DIETARY_OPTIONS, ALLERGY_OPTIONS } from '@/lib/data'
import { toast } from 'sonner'

function TagPicker({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
  }
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors capitalize ${
              selected.includes(opt)
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [dietary, setDietary] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setEmail(user.email || '')

    const profile = await getProfile(user.id)
    if (profile) {
      setFullName(profile.full_name || '')
      setDietary(profile.dietary_preferences || [])
      setAllergies(profile.allergies || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    try {
      await upsertProfile(userId, {
        full_name: fullName,
        dietary_preferences: dietary,
        allergies,
        food_preferences: [],
      })
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <User className="h-8 w-8 text-slate-300 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile & Preferences</h1>
        <p className="text-slate-500 text-sm mt-1">
          Your preferences are used to filter recipe recommendations
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullname">Full name</Label>
              <Input
                id="fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label>Email address</Label>
              <Input value={email} disabled className="bg-slate-50 text-slate-500" />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dietary preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <TagPicker
              label="Dietary style"
              options={DIETARY_OPTIONS}
              selected={dietary}
              onChange={setDietary}
            />
            <TagPicker
              label="Allergies & intolerances"
              options={ALLERGY_OPTIONS}
              selected={allergies}
              onChange={setAllergies}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </form>
    </div>
  )
}
