import { useEffect, useState } from 'react';
import { X, Clock, Users, BarChart2, CreditCard as Edit2, Trash2, Heart, Send, BookOpen, Tag, AlertCircle, FileText } from 'lucide-react';
import type { Recipe } from '../lib/database.types';
import { DIFFICULTIES, PLACEHOLDER_IMAGE } from '../lib/constants';
import { fetchRecipeWithDetails, toggleFavorite } from '../lib/api';
import { formatRecipeForTelegram, sendToTelegram } from '../lib/telegram';
import { translations } from '../lib/i18n';

interface RecipeModalProps {
  recipeId: string;
  onClose: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onFavoriteChange?: () => void;
  telegramBotToken: string;
  telegramChatId: string;
  addToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function RecipeModal({
  recipeId,
  onClose,
  onEdit,
  onDelete,
  onFavoriteChange,
  telegramBotToken,
  telegramChatId,
  addToast,
}: RecipeModalProps) {
  const t = translations.uk;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingTg, setSendingTg] = useState(false);

  useEffect(() => {
    fetchRecipeWithDetails(recipeId)
      .then(setRecipe)
      .catch(() => addToast(t.failedToLoadRecipe, 'error'))
      .finally(() => setLoading(false));
  }, [recipeId, addToast, t.failedToLoadRecipe]);

  const handleFavorite = async () => {
    if (!recipe) return;
    const next = !recipe.is_favorite;
    setRecipe({ ...recipe, is_favorite: next });
    await toggleFavorite(recipe.id, next).catch(() => {
      setRecipe({ ...recipe, is_favorite: recipe.is_favorite });
      addToast(t.failedToToggleFavorite, 'error');
    });
    onFavoriteChange?.();
  };

  const handleSendTelegram = async () => {
    if (!recipe) return;
    if (!telegramBotToken || !telegramChatId) {
      addToast(t.configureTelegramInSettings, 'error');
      return;
    }
    setSendingTg(true);
    try {
      const text = formatRecipeForTelegram(recipe);
      await sendToTelegram(telegramBotToken, telegramChatId, text);
      addToast(t.recipeSentToTelegram);
    } catch {
      addToast(t.failedToSendTelegram, 'error');
    } finally {
      setSendingTg(false);
    }
  };

  const totalTime = recipe ? (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay"
      style={{ background: 'rgba(61,44,30,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content relative w-full sm:max-w-2xl overflow-hidden"
        style={{
          background: 'var(--color-bg)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Close */}
        <button
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,253,249,0.9)', backdropFilter: 'blur(4px)', boxShadow: 'var(--shadow-sm)' }}
          onClick={onClose}
        >
          <X size={16} style={{ color: 'var(--color-text-secondary)' }} />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : !recipe ? (
          <div className="flex items-center justify-center h-64">
            <p style={{ color: 'var(--color-text-muted)' }}>{t.recipeNotFound}</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {/* Hero image */}
            <div className="relative" style={{ height: 240 }}>
              <img
                src={recipe.image_url || PLACEHOLDER_IMAGE}
                alt={recipe.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(61,44,30,0.7) 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h2
                  className="text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.5rem', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                >
                  {recipe.title}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recipe.category && (
                    <span className="tag-pill" style={{ background: 'rgba(255,253,249,0.88)', color: 'var(--color-text-secondary)' }}>
                      {recipe.category}
                    </span>
                  )}
                  {recipe.difficulty && (
                    <span className="tag-pill" style={{ background: 'rgba(255,253,249,0.88)', color: 'var(--color-text-secondary)' }}>
                      {DIFFICULTIES.find((d) => d.value === recipe.difficulty)?.label ?? recipe.difficulty}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Meta row */}
              <div className="flex flex-wrap gap-4 mb-5 pb-5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                {totalTime > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
                      <Clock size={15} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.totalTime}</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{totalTime} {t.min}</div>
                    </div>
                  </div>
                )}
                {recipe.prep_time_minutes > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
                      <Clock size={15} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.prep}</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{recipe.prep_time_minutes} {t.min}</div>
                    </div>
                  </div>
                )}
                {recipe.portions > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
                      <Users size={15} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.portionsLabel}</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{recipe.portions}</div>
                    </div>
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
                      <BarChart2 size={15} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.difficultyLabel}</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {DIFFICULTIES.find((d) => d.value === recipe.difficulty)?.label ?? recipe.difficulty}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {recipe.description && (
                <p className="mb-5 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {recipe.description}
                </p>
              )}

              {/* Ingredients */}
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                    <BookOpen size={16} style={{ color: 'var(--color-accent)' }} />
                    {t.ingredients}
                  </h3>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border-light)' }}>
                    {recipe.ingredients.map((ing, i) => (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between px-4 py-2.5"
                        style={{
                          background: i % 2 === 0 ? 'var(--color-card)' : 'var(--color-surface)',
                        }}
                      >
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{ing.name}</span>
                        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          {ing.amount > 0 ? `${ing.amount} ${ing.unit}`.trim() : ing.unit || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Steps */}
              {recipe.steps && recipe.steps.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                    <FileText size={16} style={{ color: 'var(--color-accent)' }} />
                    {t.instructions}
                  </h3>
                  <div className="space-y-3">
                    {recipe.steps.map((step) => (
                      <div key={step.id} className="flex gap-4">
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                          style={{ background: 'var(--color-accent)', color: 'white', marginTop: 2 }}
                        >
                          {step.step_number}
                        </div>
                        <p className="flex-1 text-sm leading-relaxed pt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {step.instruction}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Notes */}
              {recipe.notes && (
                <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="font-medium" style={{ color: 'var(--color-accent)' }}>{t.recipeNotePrefix} </span>
                    {recipe.notes}
                  </p>
                </div>
              )}

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                  <Tag size={13} style={{ color: 'var(--color-text-muted)' }} />
                  {recipe.tags.map((tag) => (
                    <span key={tag} className="tag-pill">{tag}</span>
                  ))}
                </div>
              )}

              {/* Allergens */}
              {recipe.allergens && recipe.allergens.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 items-center">
                  <AlertCircle size={13} style={{ color: '#c4584a' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.allergensColon}</span>
                  {recipe.allergens.map((a) => (
                    <span key={a} className="tag-pill" style={{ background: '#fee8e8', color: '#c4584a' }}>{a}</span>
                  ))}
                </div>
              )}

              {/* Labels */}
              {recipe.labels && recipe.labels.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {recipe.labels.map((l) => (
                    <span key={l} className="tag-pill" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>{l}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button className="btn-primary flex-1 min-w-0 justify-center" onClick={() => onEdit(recipe)}>
                  <Edit2 size={14} />
                  {t.edit}
                </button>
                <button
                  className="btn-secondary justify-center"
                  style={{ color: recipe.is_favorite ? '#c4584a' : undefined, flex: '0 0 auto' }}
                  onClick={handleFavorite}
                >
                  <Heart size={14} fill={recipe.is_favorite ? 'currentColor' : 'none'} />
                  {recipe.is_favorite ? t.saved : t.save}
                </button>
                <button
                  className="btn-secondary justify-center"
                  style={{ flex: '0 0 auto', opacity: sendingTg ? 0.7 : 1 }}
                  onClick={handleSendTelegram}
                  disabled={sendingTg}
                >
                  <Send size={14} />
                  {sendingTg ? t.sendingDots : t.telegram}
                </button>
                <button
                  className="btn-secondary justify-center"
                  style={{ color: '#c4584a', borderColor: '#f0c0c0', flex: '0 0 auto' }}
                  onClick={() => onDelete(recipe)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
