import { supabase } from './supabase';
import type { Recipe, RecipeIngredient, RecipeStep, ShoppingItem } from './database.types';

// ── Recipes ──────────────────────────────────────────────────────────────────

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecipeWithDetails(id: string): Promise<Recipe | null> {
  const [recipeRes, ingredientsRes, stepsRes] = await Promise.all([
    supabase.from('recipes').select('*').eq('id', id).maybeSingle(),
    supabase.from('recipe_ingredients').select('*').eq('recipe_id', id).order('sort_order'),
    supabase.from('recipe_steps').select('*').eq('recipe_id', id).order('sort_order'),
  ]);
  if (recipeRes.error) throw recipeRes.error;
  if (!recipeRes.data) return null;
  return {
    ...recipeRes.data,
    ingredients: ingredientsRes.data ?? [],
    steps: stepsRes.data ?? [],
  };
}

export async function fetchRecentRecipes(limit = 4): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchFavoriteRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_archived', false)
    .eq('is_favorite', true)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRandomRecipe(): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_archived', false);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[Math.floor(Math.random() * data.length)];
}

export async function createRecipe(
  recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'ingredients' | 'steps'>,
  ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[],
  steps: Omit<RecipeStep, 'id' | 'recipe_id'>[]
): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipe)
    .select()
    .single();
  if (error) throw error;

  if (ingredients.length > 0) {
    const { error: ingError } = await supabase.from('recipe_ingredients').insert(
      ingredients.map((ing) => ({ ...ing, recipe_id: data.id }))
    );
    if (ingError) throw ingError;
  }

  if (steps.length > 0) {
    const { error: stepError } = await supabase.from('recipe_steps').insert(
      steps.map((step) => ({ ...step, recipe_id: data.id }))
    );
    if (stepError) throw stepError;
  }

  return data;
}

export async function updateRecipe(
  id: string,
  recipe: Partial<Omit<Recipe, 'id' | 'created_at' | 'ingredients' | 'steps'>>,
  ingredients?: Omit<RecipeIngredient, 'id' | 'recipe_id'>[],
  steps?: Omit<RecipeStep, 'id' | 'recipe_id'>[]
): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update({ ...recipe, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  if (ingredients !== undefined) {
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
    if (ingredients.length > 0) {
      const { error: ingError } = await supabase.from('recipe_ingredients').insert(
        ingredients.map((ing) => ({ ...ing, recipe_id: id }))
      );
      if (ingError) throw ingError;
    }
  }

  if (steps !== undefined) {
    await supabase.from('recipe_steps').delete().eq('recipe_id', id);
    if (steps.length > 0) {
      const { error: stepError } = await supabase.from('recipe_steps').insert(
        steps.map((step) => ({ ...step, recipe_id: id }))
      );
      if (stepError) throw stepError;
    }
  }

  return data;
}

export async function toggleFavorite(id: string, is_favorite: boolean): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ is_favorite, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function archiveRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ── Shopping Items ────────────────────────────────────────────────────────────

export async function fetchShoppingItems(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createShoppingItem(
  item: Omit<ShoppingItem, 'id' | 'created_at'>
): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateShoppingItem(
  id: string,
  item: Partial<Omit<ShoppingItem, 'id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase.from('shopping_items').update(item).eq('id', id);
  if (error) throw error;
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id);
  if (error) throw error;
}

export async function clearCompletedItems(): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('is_completed', true);
  if (error) throw error;
}

// ── App Settings ──────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data?.value ?? '';
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
}

// ── Image Upload ──────────────────────────────────────────────────────────────

export async function uploadRecipeImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('recipe-images')
    .upload(filename, file, { contentType: file.type });
  if (error) throw error;

  const { data } = supabase.storage.from('recipe-images').getPublicUrl(filename);
  return data.publicUrl;
}
