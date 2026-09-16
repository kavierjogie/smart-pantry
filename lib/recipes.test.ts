import test from 'node:test'
import assert from 'node:assert/strict'

import { matchRecipesToPantry } from './recipes.ts'
import type { PantryItem, Recipe } from '@/types'

const pantry: PantryItem[] = [
  {
    id: 'p1',
    user_id: 'u1',
    name: 'salmon',
    quantity: 2000,
    unit: 'g',
    category: 'seafood',
    expiry_date: null,
    min_quantity: null,
    purchase_price: null,
    notes: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'p2',
    user_id: 'u1',
    name: 'rice',
    quantity: 500,
    unit: 'g',
    category: 'grains',
    expiry_date: null,
    min_quantity: null,
    purchase_price: null,
    notes: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'p3',
    user_id: 'u1',
    name: 'spinach',
    quantity: 100,
    unit: 'g',
    category: 'produce',
    expiry_date: null,
    min_quantity: null,
    purchase_price: null,
    notes: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
]

const recipes: Recipe[] = [
  {
    id: 'fish',
    name: 'Salmon Rice Bowl',
    description: '',
    ingredients: [
      { name: 'salmon', quantity: 400, unit: 'g' },
      { name: 'rice', quantity: 200, unit: 'g' },
      { name: 'spinach', quantity: 100, unit: 'g' },
    ],
    instructions: [],
    cooking_time: 20,
    prep_time: 5,
    servings: 2,
    difficulty: 'easy',
    dietary_tags: ['gluten-free'],
    cuisine: 'Asian',
    image_url: null,
    created_at: '2026-01-01',
  },
  {
    id: 'chicken',
    name: 'Chicken Stir-Fry',
    description: '',
    ingredients: [
      { name: 'chicken breast', quantity: 500, unit: 'g' },
      { name: 'soy sauce', quantity: 3, unit: 'tbsp' },
      { name: 'garlic', quantity: 3, unit: 'cloves' },
    ],
    instructions: [],
    cooking_time: 20,
    prep_time: 15,
    servings: 4,
    difficulty: 'easy',
    dietary_tags: ['high-protein'],
    cuisine: 'Asian',
    image_url: null,
    created_at: '2026-01-01',
  },
  {
    id: 'lentil',
    name: 'Lentil Dal',
    description: '',
    ingredients: [
      { name: 'red lentils', quantity: 250, unit: 'g' },
      { name: 'coconut milk', quantity: 200, unit: 'ml' },
      { name: 'onion', quantity: 1, unit: 'pcs' },
    ],
    instructions: [],
    cooking_time: 35,
    prep_time: 10,
    servings: 4,
    difficulty: 'easy',
    dietary_tags: ['vegan'],
    cuisine: 'Indian',
    image_url: null,
    created_at: '2026-01-01',
  },
]

test('fish-heavy pantry prioritizes fish recipes over unrelated recipes', () => {
  const matches = matchRecipesToPantry(pantry, recipes)
  assert.equal(matches[0].recipe.name, 'Salmon Rice Bowl')
  assert.ok(matches[0].matchPercentage >= matches[1].matchPercentage)
})

test('generic fish pantry matches specific fish ingredients', () => {
  const fishPantry = pantry.map((item) => item.name === 'salmon' ? { ...item, name: 'fish' } : item)
  const matches = matchRecipesToPantry(fishPantry, recipes)
  assert.equal(matches[0].recipe.name, 'Salmon Rice Bowl')
  assert.ok(matches[0].availableIngredients.includes('salmon'))
})
