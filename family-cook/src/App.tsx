import { useState, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import RecipesPage from './pages/RecipesPage';
import ShoppingPage from './pages/ShoppingPage';
import SettingsPage from './pages/SettingsPage';
import RecipeModal from './components/RecipeModal';
import RecipeForm from './components/RecipeForm';
import ConfirmDialog from './components/ConfirmDialog';
import ToastContainer from './components/Toast';
import { useToast } from './hooks/useToast';
import { archiveRecipe, getAllSettings } from './lib/api';
import type { Recipe } from './lib/database.types';
import { translations } from './lib/i18n';

type Page = 'home' | 'recipes' | 'shopping' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const [recipesKey, setRecipesKey] = useState(0);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [appIcon, setAppIcon] = useState<string | undefined>(undefined);

  const { toasts, addToast, removeToast } = useToast();
  const t = translations.uk;

  useEffect(() => {
    getAllSettings().then((s) => {
      setTelegramBotToken(s['telegram_bot_token'] ?? '');
      setTelegramChatId(s['telegram_chat_id'] ?? '');
      setAppIcon(s['app_icon'] ?? undefined);
    }).catch(() => {});
  }, []);

  const handleSettingsChange = async () => {
    const s = await getAllSettings().catch(() => ({} as Record<string, string>));
    setTelegramBotToken(s['telegram_bot_token'] ?? '');
    setTelegramChatId(s['telegram_chat_id'] ?? '');
    setAppIcon(s['app_icon'] ?? undefined);
  };

  const handleAddRecipe = useCallback(() => {
    setEditingRecipe(undefined);
    setShowForm(true);
  }, []);

  const handleEditRecipe = useCallback((recipe: Recipe) => {
    setOpenRecipeId(null);
    setEditingRecipe(recipe);
    setShowForm(true);
  }, []);

  const handleFormSave = useCallback(() => {
    setShowForm(false);
    setEditingRecipe(undefined);
    setRecipesKey((k) => k + 1);
  }, []);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingRecipe(undefined);
  }, []);

  const handleDeleteRequest = useCallback((recipe: Recipe) => {
    setOpenRecipeId(null);
    setDeletingRecipe(recipe);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingRecipe) return;
    await archiveRecipe(deletingRecipe.id).catch(() => {
      addToast(t.failedToArchiveRecipe, 'error');
    });
    setDeletingRecipe(null);
    setRecipesKey((k) => k + 1);
    addToast(t.recipeArchived);
  };

  return (
    <>
      <Layout currentPage={page} onNavigate={setPage} onAddRecipe={handleAddRecipe} appIcon={appIcon}>
        {page === 'home' && (
          <HomePage
            onNavigate={setPage}
            onAddRecipe={handleAddRecipe}
            onOpenRecipe={setOpenRecipeId}
          />
        )}
        {page === 'recipes' && (
          <RecipesPage
            onOpenRecipe={setOpenRecipeId}
            addToast={addToast}
            refreshKey={recipesKey}
          />
        )}
        {page === 'shopping' && <ShoppingPage addToast={addToast} />}
        {page === 'settings' && <SettingsPage addToast={addToast} onSettingsChange={handleSettingsChange} />}
      </Layout>

      {/* Recipe detail modal */}
      {openRecipeId && (
        <RecipeModal
          recipeId={openRecipeId}
          onClose={() => setOpenRecipeId(null)}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRequest}
          onFavoriteChange={() => setRecipesKey((k) => k + 1)}
          telegramBotToken={telegramBotToken}
          telegramChatId={telegramChatId}
          addToast={addToast}
        />
      )}

      {/* Recipe add/edit form */}
      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
          addToast={addToast}
        />
      )}

      {/* Delete confirmation */}
      {deletingRecipe && (
        <ConfirmDialog
          title={t.archiveRecipe}
          message={`«${deletingRecipe.title}» ${t.recipeWillBeMoved}`}
          confirmLabel={t.archive}
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingRecipe(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
