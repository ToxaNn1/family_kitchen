export interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_time_minutes: number;
  cook_time_minutes: number;
  portions: number;
  notes: string;
  tags: string[];
  allergens: string[];
  labels: string[];
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number;
  unit: string;
  sort_order: number;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  sort_order: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  note: string;
  is_completed: boolean;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      recipes: {
        Row: Recipe;
        Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'ingredients' | 'steps'>;
        Update: Partial<Omit<Recipe, 'id' | 'created_at' | 'ingredients' | 'steps'>>;
      };
      recipe_ingredients: {
        Row: RecipeIngredient;
        Insert: Omit<RecipeIngredient, 'id'>;
        Update: Partial<Omit<RecipeIngredient, 'id'>>;
      };
      recipe_steps: {
        Row: RecipeStep;
        Insert: Omit<RecipeStep, 'id'>;
        Update: Partial<Omit<RecipeStep, 'id'>>;
      };
      shopping_items: {
        Row: ShoppingItem;
        Insert: Omit<ShoppingItem, 'id' | 'created_at'>;
        Update: Partial<Omit<ShoppingItem, 'id' | 'created_at'>>;
      };
      app_settings: {
        Row: AppSetting;
        Insert: Omit<AppSetting, 'updated_at'>;
        Update: Partial<Omit<AppSetting, 'key'>>;
      };
    };
  };
};
