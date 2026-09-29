// Demo mode: a cookie flags the session (so middleware + API routes can see it),
// and all data lives in localStorage so the demo works with Supabase offline.
import type { PantryItem, Profile, ShoppingItem } from '@/types'

export const DEMO_COOKIE = 'sp_demo'
export const DEMO_USER = { id: 'demo-user', email: 'demo@smartpantry.app' }

const STORE_KEY = 'sp_demo_data_v1'

export function isDemoMode(): boolean {
  return typeof document !== 'undefined' && document.cookie.split('; ').some(c => c.startsWith(`${DEMO_COOKIE}=`))
}

export function enterDemo() {
  localStorage.removeItem(STORE_KEY)
  document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
}

export function exitDemo() {
  localStorage.removeItem(STORE_KEY)
  document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0; samesite=lax`
}

// ---------- seed data ----------

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

type SeedPantry = [name: string, qty: number, unit: PantryItem['unit'], cat: PantryItem['category'], expiryDays: number | null, min: number | null, price: number | null]

const SEED_PANTRY: SeedPantry[] = [
  ['spaghetti', 500, 'g', 'grains', 240, 200, 24.99],
  ['basmati rice', 2, 'kg', 'grains', 300, 1, 54.99],
  ['red lentils', 250, 'g', 'grains', 180, 300, 29.99],
  ['canned tomatoes', 3, 'can', 'canned', 400, 2, 44.97],
  ['coconut milk', 1, 'can', 'canned', 200, 1, 27.99],
  ['vegetable stock', 1, 'l', 'canned', 90, null, 32.99],
  ['olive oil', 500, 'ml', 'condiments', 365, 250, 119.99],
  ['soy sauce', 250, 'ml', 'condiments', 300, null, 34.99],
  ['garlic', 8, 'pcs', 'produce', 12, 4, 12.99],
  ['onion', 3, 'pcs', 'produce', 18, 2, 15.99],
  ['bell pepper', 2, 'pcs', 'produce', 4, 1, 21.99],
  ['spinach', 150, 'g', 'produce', 2, null, 24.99],
  ['tomatoes', 4, 'pcs', 'produce', 5, null, 19.99],
  ['basil', 1, 'bunch', 'produce', -1, null, 17.99],
  ['eggs', 6, 'pcs', 'dairy', 10, 6, 39.99],
  ['feta cheese', 200, 'g', 'dairy', 6, null, 49.99],
  ['milk', 1, 'l', 'dairy', 3, 1, 22.99],
  ['cream', 250, 'ml', 'dairy', -2, null, 29.99],
  ['chicken breast', 500, 'g', 'meat', 2, null, 89.99],
  ['frozen peas', 1, 'bag', 'frozen', 150, null, 34.99],
  ['cumin', 1, 'tsp', 'spices', null, 2, 18.99],
  ['paprika', 40, 'g', 'spices', null, null, 21.99],
  ['red chili flakes', 30, 'g', 'spices', null, null, 19.99],
  ['plain flour', 1, 'kg', 'baking', 120, 1, 26.99],
]

function seed() {
  const now = new Date().toISOString()
  const pantry: PantryItem[] = SEED_PANTRY.map(([name, quantity, unit, category, exp, min, price], i) => ({
    id: `demo-p${i}`,
    user_id: DEMO_USER.id,
    name,
    quantity,
    unit,
    category,
    expiry_date: exp === null ? null : daysFromNow(exp),
    min_quantity: min,
    purchase_price: price,
    notes: null,
    created_at: now,
    updated_at: now,
  }))

  const shopping: ShoppingItem[] = [
    ['parmesan', 1, 'pack', 'dairy', 'Spaghetti Aglio e Olio', false],
    ['ginger', 1, 'pcs', 'produce', 'Chicken Stir-Fry', false],
    ['broccoli', 300, 'g', 'produce', 'Chicken Stir-Fry', false],
    ['greek yoghurt', 1, 'pcs', 'dairy', null, false],
    ['bananas', 6, 'pcs', 'produce', null, true],
  ].map(([name, quantity, unit, category, recipe_name, checked], i) => ({
    id: `demo-s${i}`,
    user_id: DEMO_USER.id,
    name: name as string,
    quantity: quantity as number,
    unit: unit as ShoppingItem['unit'],
    category: category as ShoppingItem['category'],
    checked: checked as boolean,
    recipe_id: null,
    recipe_name: recipe_name as string | null,
    notes: null,
    created_at: now,
    updated_at: now,
  }))

  const profile: Profile = {
    id: 'demo-profile',
    user_id: DEMO_USER.id,
    full_name: 'Demo Recruiter',
    avatar_url: null,
    dietary_preferences: ['high-protein'],
    allergies: [],
    food_preferences: [],
    created_at: now,
    updated_at: now,
  }

  return { pantry_items: pantry, shopping_list_items: shopping, profile }
}

// ---------- localStorage store ----------

type DemoData = ReturnType<typeof seed>
type Table = 'pantry_items' | 'shopping_list_items'
type Row = { id: string; created_at: string; updated_at: string }

function load(): DemoData {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* corrupt or unavailable storage: reseed */ }
  const data = seed()
  save(data)
  return data
}

const tables = <T>(data: DemoData) => data as unknown as Record<Table, T[]>

function save(data: DemoData) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)) } catch { /* private mode: in-memory only */ }
}

export function demoList<T>(table: Table): T[] {
  return tables<T>(load())[table]
}

export function demoInsert<T extends Row>(table: Table, item: Omit<T, keyof Row>): T {
  const data = load()
  const now = new Date().toISOString()
  const row = { ...item, id: crypto.randomUUID(), created_at: now, updated_at: now } as T
  tables<T>(data)[table].unshift(row)
  save(data)
  return row
}

export function demoUpdate<T extends Row>(table: Table, id: string, updates: Partial<T>): T {
  const data = load()
  const rows = tables<T>(data)[table]
  const i = rows.findIndex(r => r.id === id)
  if (i === -1) throw new Error('Item not found')
  rows[i] = { ...rows[i], ...updates, id, updated_at: new Date().toISOString() }
  save(data)
  return rows[i]
}

export function demoDelete<T>(table: Table, match: (row: T) => boolean) {
  const data = load()
  tables<T>(data)[table] = tables<T>(data)[table].filter(r => !match(r))
  save(data)
}

export function demoGetProfile(): Profile {
  return load().profile
}

export function demoSaveProfile(updates: Partial<Profile>): Profile {
  const data = load()
  data.profile = { ...data.profile, ...updates, updated_at: new Date().toISOString() }
  save(data)
  return data.profile
}
