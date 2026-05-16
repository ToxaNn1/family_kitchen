import { useEffect, useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Recipe } from '../lib/database.types';
import { fetchRecipes, toggleFavorite } from '../lib/api';
import RecipeCard from '../components/RecipeCard';
import { FILTER_CATEGORIES, CATEGORY_FILTER_VALUES } from '../lib/constants';
import { translations } from '../lib/i18n';

interface RecipesPageProps {
  onOpenRecipe: (id: string) => void;
  onRecipesChanged?: () => void;
  addToast: (msg: string, type?: 'success' | 'error') => void;
  refreshKey?: number;
}

export default function RecipesPage({ onOpenRecipe, addToast, refreshKey }: RecipesPageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const t = translations.uk;

  const loadRecipes = async () => {
    setLoading(true);
    const data = await fetchRecipes().catch(() => []);
    setRecipes(data);
    setLoading(false);
  };

  useEffect(() => { loadRecipes(); }, [refreshKey]);

  const handleToggleFavorite = async (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    const next = !recipe.is_favorite;
    setRecipes((prev) => prev.map((r) => r.id === recipe.id ? { ...r, is_favorite: next } : r));
    await toggleFavorite(recipe.id, next).catch(() => {
      setRecipes((prev) => prev.map((r) => r.id === recipe.id ? { ...r, is_favorite: recipe.is_favorite } : r));
      addToast(t.failedToToggleFavorite, 'error');
    });
  };

  const filtered = useMemo(() => {
    let result = recipes;

    if (activeFilter === 'favorites') {
      result = result.filter((r) => r.is_favorite);
    } else if (activeFilter === 'quick') {
      result = result.filter((r) => (r.prep_time_minutes + r.cook_time_minutes) <= 30);
    } else if (activeFilter === 'vegetarian') {
      result = result.filter((r) => r.tags?.includes('vegetarian') || r.labels?.includes('vegetarian'));
    } else if (activeFilter !== 'all') {
      const allowed = CATEGORY_FILTER_VALUES[activeFilter];
      if (allowed) {
        result = result.filter((r) => allowed.includes(r.category || ''));
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (tagFilter.trim()) {
      const tagQ = tagFilter.toLowerCase();
      result = result.filter((r) => r.tags?.some((tag) => tag.toLowerCase().includes(tagQ)));
    }

    return result;
  }, [recipes, activeFilter, search, tagFilter]);

  const countLabel = recipes.length === 1
    ? `${recipes.length} ${t.recipeIn}`
    : `${recipes.length} ${t.recipesIn}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
          {t.recipes}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {countLabel}
        </p>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <input
          className="input-base"
          style={{ paddingLeft: '2.25rem', paddingRight: search ? '2.25rem' : undefined }}
          placeholder={t.searchRecipes}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
            <X size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTER_CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: activeFilter === key ? 'var(--color-accent)' : 'var(--color-card)',
              color: activeFilter === key ? 'white' : 'var(--color-text-secondary)',
              border: `1.5px solid ${activeFilter === key ? 'var(--color-accent)' : 'var(--color-border)'}`,
              boxShadow: activeFilter === key ? '0 2px 8px rgba(196,116,74,0.25)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
        <button
          className="flex-shrink-0 btn-ghost py-1 px-3"
          onClick={() => setShowTagInput(!showTagInput)}
          style={{ fontSize: '0.875rem' }}
        >
          <SlidersHorizontal size={14} />
          {t.tags}
        </button>
      </div>

      {showTagInput && (
        <div className="flex gap-2 mb-4 animate-slide-in">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              className="input-base"
              style={{ paddingLeft: '2rem' }}
              placeholder={t.filterByTag}
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            />
          </div>
          {tagFilter && (
            <button className="btn-secondary py-2 px-3" onClick={() => setTagFilter('')}>
              <X size={14} /> {t.clear}
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div style={{ height: 180, background: 'var(--color-surface)' }} />
              <div className="p-4">
                <div className="h-4 rounded mb-2" style={{ background: 'var(--color-surface)', width: '70%' }} />
                <div className="h-3 rounded" style={{ background: 'var(--color-surface)', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg mb-2" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-text-secondary)' }}>
            {search || tagFilter || activeFilter !== 'all' ? t.noRecipesMatch : t.noRecipesYet}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {search || tagFilter ? t.tryAdjustingSearch : t.startAddingRecipes}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => onOpenRecipe(recipe.id)}
              onToggleFavorite={(e) => handleToggleFavorite(e, recipe)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
