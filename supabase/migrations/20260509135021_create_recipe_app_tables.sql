
/*
  # Family Recipe App — Initial Schema

  ## New Tables

  ### recipes
  Core recipe records.
  - id, title, description, image_url, category, difficulty, prep_time_minutes, cook_time_minutes, portions, notes, tags (text[]), allergens (text[]), labels (text[]), is_favorite, is_archived, created_at, updated_at

  ### recipe_ingredients
  Structured ingredients linked to a recipe.
  - id, recipe_id (FK), name, amount (numeric), unit, sort_order

  ### recipe_steps
  Numbered cooking steps linked to a recipe.
  - id, recipe_id (FK), step_number, instruction, sort_order

  ### shopping_items
  Shopping list items.
  - id, name, quantity, unit, note, is_completed, created_at

  ### app_settings
  Key/value store for app-wide settings (e.g. Telegram bot token, chat id).
  - key, value, updated_at

  ## Security
  - RLS enabled on all tables
  - Policies allow full access (no auth required — private family app, anon role used)

  ## Notes
  1. This is a private family app with no user authentication.
  2. All access is granted to the anon role (public client).
  3. The app_settings table stores Telegram credentials.
*/

-- recipes
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  image_url text DEFAULT '',
  category text DEFAULT '',
  difficulty text DEFAULT 'easy',
  prep_time_minutes integer DEFAULT 0,
  cook_time_minutes integer DEFAULT 0,
  portions integer DEFAULT 1,
  notes text DEFAULT '',
  tags text[] DEFAULT '{}',
  allergens text[] DEFAULT '{}',
  labels text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select recipes"
  ON recipes FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon can insert recipes"
  ON recipes FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update recipes"
  ON recipes FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete recipes"
  ON recipes FOR DELETE TO anon
  USING (true);

-- recipe_ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  amount numeric DEFAULT 0,
  unit text DEFAULT '',
  sort_order integer DEFAULT 0
);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select recipe_ingredients"
  ON recipe_ingredients FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert recipe_ingredients"
  ON recipe_ingredients FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update recipe_ingredients"
  ON recipe_ingredients FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete recipe_ingredients"
  ON recipe_ingredients FOR DELETE TO anon USING (true);

-- recipe_steps
CREATE TABLE IF NOT EXISTS recipe_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number integer NOT NULL DEFAULT 1,
  instruction text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0
);

ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select recipe_steps"
  ON recipe_steps FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert recipe_steps"
  ON recipe_steps FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update recipe_steps"
  ON recipe_steps FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete recipe_steps"
  ON recipe_steps FOR DELETE TO anon USING (true);

-- shopping_items
CREATE TABLE IF NOT EXISTS shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  quantity text DEFAULT '',
  unit text DEFAULT '',
  note text DEFAULT '',
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select shopping_items"
  ON shopping_items FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert shopping_items"
  ON shopping_items FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update shopping_items"
  ON shopping_items FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete shopping_items"
  ON shopping_items FOR DELETE TO anon USING (true);

-- app_settings
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select app_settings"
  ON app_settings FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert app_settings"
  ON app_settings FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update app_settings"
  ON app_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete app_settings"
  ON app_settings FOR DELETE TO anon USING (true);

-- Storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for recipe-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'anon can upload recipe images'
  ) THEN
    CREATE POLICY "anon can upload recipe images"
      ON storage.objects FOR INSERT TO anon
      WITH CHECK (bucket_id = 'recipe-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'anon can read recipe images'
  ) THEN
    CREATE POLICY "anon can read recipe images"
      ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'recipe-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'anon can delete recipe images'
  ) THEN
    CREATE POLICY "anon can delete recipe images"
      ON storage.objects FOR DELETE TO anon
      USING (bucket_id = 'recipe-images');
  END IF;
END $$;
