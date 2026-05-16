import { useEffect, useState } from 'react';
import { Plus, ShoppingCart, BookOpen, Shuffle, Heart, Clock, ArrowRight } from 'lucide-react';
import type { Recipe } from '../lib/database.types';
import { fetchRecentRecipes, fetchFavoriteRecipes, fetchRandomRecipe } from '../lib/api';
import { PLACEHOLDER_IMAGE } from '../lib/constants';
import { translations } from '../lib/i18n';

interface HomePageProps {
  onNavigate: (page: 'recipes' | 'shopping' | 'home' | 'settings') => void;
  onAddRecipe: () => void;
  onOpenRecipe: (id: string) => void;
}

function SmallRecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const t = translations.uk;
  return (
    <div
      className="card cursor-pointer flex gap-3 p-3 items-center"
      onClick={onClick}
      style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 56, height: 56 }}>
        <img
          src={recipe.image_url || PLACEHOLDER_IMAGE}
          alt={recipe.title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)', fontFamily: 'Playfair Display, serif' }}>
          {recipe.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {recipe.category && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{recipe.category}</span>}
          {totalTime > 0 && (
            <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--color-text-light)' }}>
              <Clock size={10} /> {totalTime} {t.min}
            </span>
          )}
        </div>
      </div>
      <ArrowRight size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
    </div>
  );
}

export default function HomePage({ onNavigate, onAddRecipe, onOpenRecipe }: HomePageProps) {
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const t = translations.uk;

  useEffect(() => {
    fetchRecentRecipes(4).then(setRecentRecipes).catch(() => {});
    fetchFavoriteRecipes().then((r) => setFavoriteRecipes(r.slice(0, 4))).catch(() => {});
    fetchRandomRecipe().then(setRandomRecipe).catch(() => {});
  }, []);

  const refreshRandom = async () => {
    setRandomLoading(true);
    const r = await fetchRandomRecipe().catch(() => null);
    setRandomRecipe(r);
    setRandomLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          {t.welcomeHome}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{t.yourRecipes}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Plus, label: t.addRecipe, color: 'var(--color-text-secondary)', bg: 'var(--color-accent)', action: onAddRecipe },
          { icon: BookOpen, label: t.allRecipes, color: 'var(--color-text-secondary)', bg: 'var(--color-surface)', action: () => onNavigate('recipes') },
          { icon: ShoppingCart, label: t.shoppingList, color: 'var(--color-text-secondary)', bg: 'var(--color-surface)', action: () => onNavigate('shopping') },
          { icon: Heart, label: t.favorites, color: '#c4584a', bg: '#fee8e8', action: () => onNavigate('recipes') },
        ].map(({ icon: Icon, label, color, bg, action }) => (
          <button
            key={label}
            onClick={action}
            className="card p-4 flex flex-col items-center gap-2 text-center"
            style={{ cursor: 'pointer', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg === 'var(--color-accent)' ? bg : bg }}>
              <Icon size={18} style={{ color: bg === 'var(--color-accent)' ? 'white' : color }} />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                {t.recentlyAdded}
              </h2>
              <button className="btn-ghost py-1 px-2 text-xs" onClick={() => onNavigate('recipes')}>
                {t.viewAll} <ArrowRight size={12} />
              </button>
            </div>
            {recentRecipes.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>{t.noRecipesYet}</p>
                <button className="btn-primary py-2 px-4 text-sm" onClick={onAddRecipe}>
                  <Plus size={14} /> {t.addYourFirstRecipe}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRecipes.map((r) => (
                  <SmallRecipeCard key={r.id} recipe={r} onClick={() => onOpenRecipe(r.id)} />
                ))}
              </div>
            )}
          </section>

          {favoriteRecipes.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                  {t.favorites}
                </h2>
                <button className="btn-ghost py-1 px-2 text-xs" onClick={() => onNavigate('recipes')}>
                  {t.viewAll} <ArrowRight size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {favoriteRecipes.map((r) => (
                  <SmallRecipeCard key={r.id} recipe={r} onClick={() => onOpenRecipe(r.id)} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                {t.randomDish}
              </h2>
              <button
                className="btn-ghost py-1 px-2 text-xs"
                onClick={refreshRandom}
                style={{ opacity: randomLoading ? 0.6 : 1 }}
              >
                <Shuffle size={12} /> {t.shuffle}
              </button>
            </div>
            {randomRecipe ? (
              <div
                className="card cursor-pointer overflow-hidden"
                onClick={() => onOpenRecipe(randomRecipe.id)}
                style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <div className="relative overflow-hidden" style={{ height: 140 }}>
                  <img
                    src={randomRecipe.image_url || PLACEHOLDER_IMAGE}
                    alt={randomRecipe.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(61,44,30,0.6) 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-semibold" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      {randomRecipe.title}
                    </p>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    {randomRecipe.category && <span className="tag-pill">{randomRecipe.category}</span>}
                    {(randomRecipe.prep_time_minutes + randomRecipe.cook_time_minutes) > 0 && (
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                        <Clock size={11} />
                        {randomRecipe.prep_time_minutes + randomRecipe.cook_time_minutes} {t.min}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-5 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t.addRecipesToGetSuggestion}</p>
              </div>
            )}
          </section>

          <section>
            <button
              className="card w-full p-4 flex items-center gap-3 text-left"
              onClick={() => onNavigate('shopping')}
              style={{ cursor: 'pointer', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
                <ShoppingCart size={18} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.shoppingList}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.manageGroceryList}</div>
              </div>
              <ArrowRight size={14} className="ml-auto" style={{ color: 'var(--color-text-light)' }} />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
