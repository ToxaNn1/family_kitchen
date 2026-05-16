import { Heart, Clock, ChefHat } from 'lucide-react';
import type { Recipe } from '../lib/database.types';
import { DIFFICULTIES } from '../lib/constants';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const difficultyClass: Record<string, string> = {
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
};

export default function RecipeCard({ recipe, onClick, onToggleFavorite }: RecipeCardProps) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <div
      className="card cursor-pointer group overflow-hidden"
      onClick={onClick}
      style={{ transform: 'translateY(0)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className="font-semibold line-clamp-2 leading-snug flex-1"
            style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: 'var(--color-text-primary)' }}
          >
            {recipe.title}
          </h3>
          <button
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center transition-colors"
            style={{
              color: recipe.is_favorite ? '#c4584a' : 'var(--color-text-muted)',
            }}
            onClick={onToggleFavorite}
            type="button"
          >
            <Heart
              size={16}
              fill={recipe.is_favorite ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          {recipe.category && (
            <span className="tag-pill text-xs">{recipe.category}</span>
          )}
          {recipe.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyClass[recipe.difficulty] || ''}`}>
              {DIFFICULTIES.find((d) => d.value === recipe.difficulty)?.label ?? recipe.difficulty}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {totalTime > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <Clock size={12} />
              {totalTime} хв
            </span>
          )}
          {recipe.portions > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <ChefHat size={12} />
              {recipe.portions}
            </span>
          )}
        </div>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag-pill text-xs">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
