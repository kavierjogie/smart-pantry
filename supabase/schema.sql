-- ============================================================
-- Smart Pantry & Recipe Assistant — Supabase SQL Schema
-- Run this entire file in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name       TEXT,
  avatar_url      TEXT,
  dietary_preferences TEXT[] DEFAULT '{}',
  allergies       TEXT[] DEFAULT '{}',
  food_preferences TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- PANTRY ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS pantry_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  quantity        NUMERIC NOT NULL DEFAULT 0,
  unit            TEXT NOT NULL DEFAULT 'pcs',
  category        TEXT NOT NULL DEFAULT 'other',
  expiry_date     DATE,
  min_quantity    NUMERIC,
  purchase_price  NUMERIC,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS pantry_items_user_id_idx ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS pantry_items_category_idx ON pantry_items(category);
CREATE INDEX IF NOT EXISTS pantry_items_expiry_idx ON pantry_items(expiry_date);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pantry items"
  ON pantry_items FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SHOPPING LIST ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  quantity        NUMERIC NOT NULL DEFAULT 1,
  unit            TEXT NOT NULL DEFAULT 'pcs',
  category        TEXT NOT NULL DEFAULT 'other',
  checked         BOOLEAN NOT NULL DEFAULT FALSE,
  recipe_id       TEXT,
  recipe_name     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS shopping_items_user_id_idx ON shopping_list_items(user_id);
CREATE INDEX IF NOT EXISTS shopping_items_checked_idx ON shopping_list_items(checked);

ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shopping list"
  ON shopping_list_items FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SAVED RECIPES
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_recipes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id       TEXT NOT NULL,
  recipe_data     JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS saved_recipes_user_id_idx ON saved_recipes(user_id);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved recipes"
  ON saved_recipes FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- PURCHASES (for spend tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pantry_item_id  UUID REFERENCES pantry_items(id) ON DELETE SET NULL,
  item_name       TEXT NOT NULL,
  quantity        NUMERIC NOT NULL,
  unit            TEXT NOT NULL,
  price           NUMERIC NOT NULL DEFAULT 0,
  purchased_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON purchases(user_id);
CREATE INDEX IF NOT EXISTS purchases_purchased_at_idx ON purchases(purchased_at);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own purchases"
  ON purchases FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- AUTO-UPDATE updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER shopping_items_updated_at
  BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- ============================================================
-- OPTIONAL: Seed sample pantry data for testing
-- Replace 'YOUR-USER-ID' with a real user UUID from auth.users
-- ============================================================
-- INSERT INTO pantry_items (user_id, name, quantity, unit, category, expiry_date, min_quantity, purchase_price)
-- VALUES
--   ('YOUR-USER-ID', 'Eggs', 6, 'pcs', 'dairy', NOW() + INTERVAL '14 days', 2, 35),
--   ('YOUR-USER-ID', 'Olive oil', 500, 'ml', 'condiments', NULL, 100, 89),
--   ('YOUR-USER-ID', 'Garlic', 5, 'pcs', 'produce', NOW() + INTERVAL '21 days', 2, 12),
--   ('YOUR-USER-ID', 'Canned tomatoes', 2, 'can', 'canned', NULL, 1, 18),
--   ('YOUR-USER-ID', 'Spaghetti', 400, 'g', 'grains', NULL, 100, 24),
--   ('YOUR-USER-ID', 'Chicken breast', 500, 'g', 'meat', NOW() + INTERVAL '3 days', 200, 65),
--   ('YOUR-USER-ID', 'Onion', 3, 'pcs', 'produce', NOW() + INTERVAL '30 days', 1, 8),
--   ('YOUR-USER-ID', 'Milk', 1, 'l', 'dairy', NOW() + INTERVAL '5 days', NULL, 22);
