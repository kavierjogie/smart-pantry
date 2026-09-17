export type User = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export type Profile = {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  dietary_preferences: string[]
  allergies: string[]
  food_preferences: string[]
  created_at: string
  updated_at: string
}

export type PantryCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'seafood'
  | 'grains'
  | 'canned'
  | 'frozen'
  | 'beverages'
  | 'condiments'
  | 'snacks'
  | 'baking'
  | 'spices'
  | 'other'

export type PantryUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'oz'
  | 'lb'
  | 'pcs'
  | 'bunch'
  | 'slice'
  | 'can'
  | 'bag'
  | 'box'
  | 'bottle'
  | 'pack'

export type PantryItem = {
  id: string
  user_id: string
  name: string
  quantity: number
  unit: PantryUnit
  category: PantryCategory
  expiry_date: string | null
  min_quantity: number | null
  purchase_price: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type RecipeDifficulty = 'easy' | 'medium' | 'hard'

export type RecipeIngredient = {
  name: string
  quantity: number
  unit: string
  optional?: boolean
}

export type Recipe = {
  id: string
  name: string
  description: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  cooking_time: number | null
  prep_time: number | null
  servings: number
  difficulty: RecipeDifficulty
  dietary_tags: string[]
  cuisine: string
  image_url: string | null
  created_at: string
}

export type SavedRecipe = {
  id: string
  user_id: string
  recipe_id: string
  recipe: Recipe
  created_at: string
}

export type ShoppingItem = {
  id: string
  user_id: string
  name: string
  quantity: number
  unit: PantryUnit
  category: PantryCategory
  checked: boolean
  recipe_id: string | null
  recipe_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Purchase = {
  id: string
  user_id: string
  pantry_item_id: string | null
  item_name: string
  quantity: number
  unit: PantryUnit
  price: number
  purchased_at: string
  created_at: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type RecipeMatch = {
  recipe: Recipe
  availableIngredients: string[]
  missingIngredients: RecipeIngredient[]
  matchPercentage: number
}

export type DashboardStats = {
  totalItems: number
  lowStockItems: number
  expiringItems: number
  shoppingListItems: number
}

export type InsightData = {
  totalSpend: number
  wastedValue: number
  topIngredients: { name: string; count: number }[]
  expiringItems: PantryItem[]
  monthlySpend: { month: string; amount: number }[]
}

export type Cookbook = {
  id: string
  title: string
  author: string
  description: string
  category: string
  rating: number
  image_url: string | null
  buy_url: string
  tags: string[]
  publication_year: number | null
  isbn: string | null
}
