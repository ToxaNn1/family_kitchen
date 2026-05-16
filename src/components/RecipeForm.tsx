import { useState, useRef, useCallback } from 'react';
import {
  X, Plus, Trash2, Upload, GripVertical, ChevronDown
} from 'lucide-react';
import type { Recipe, RecipeIngredient, RecipeStep } from '../lib/database.types';
import { CATEGORIES, DIFFICULTIES, UNITS } from '../lib/constants';
import { createRecipe, updateRecipe, uploadRecipeImage } from '../lib/api';
import { translations } from '../lib/i18n';

type IngredientDraft = Omit<RecipeIngredient, 'id' | 'recipe_id'>;
type StepDraft = Omit<RecipeStep, 'id' | 'recipe_id'>;

interface RecipeFormProps {
  recipe?: Recipe;
  onSave: () => void;
  onCancel: () => void;
  addToast: (msg: string, type?: 'success' | 'error') => void;
}

function blankIngredient(sort_order: number): IngredientDraft {
  return { name: '', amount: 0, unit: 'г', sort_order };
}

function blankStep(step_number: number): StepDraft {
  return { step_number, instruction: '', sort_order: step_number - 1 };
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="tag-pill flex items-center gap-1">
            {tag}
            <button onClick={() => onChange(tags.filter((t) => t !== tag))} type="button">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input-base"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" className="btn-secondary py-2 px-3" onClick={add}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default function RecipeForm({ recipe, onSave, onCancel, addToast }: RecipeFormProps) {
  const t = translations.uk;
  const isEdit = !!recipe;

  const [title, setTitle] = useState(recipe?.title ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [category, setCategory] = useState(recipe?.category ?? '');
  const [difficulty, setDifficulty] = useState<Recipe['difficulty']>(recipe?.difficulty ?? 'easy');
  const [prepTime, setPrepTime] = useState(recipe?.prep_time_minutes ?? 0);
  const [cookTime, setCookTime] = useState(recipe?.cook_time_minutes ?? 0);
  const [portions, setPortions] = useState(recipe?.portions ?? 2);
  const [notes, setNotes] = useState(recipe?.notes ?? '');
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? []);
  const [allergens, setAllergens] = useState<string[]>(recipe?.allergens ?? []);
  const [labels, setLabels] = useState<string[]>(recipe?.labels ?? []);
  const [imageUrl, setImageUrl] = useState(recipe?.image_url ?? '');
  const [imagePreview, setImagePreview] = useState(recipe?.image_url ?? '');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    recipe?.ingredients?.map((i) => ({
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      sort_order: i.sort_order,
    })) ?? [blankIngredient(0)]
  );

  const [steps, setSteps] = useState<StepDraft[]>(
    recipe?.steps?.map((s) => ({
      step_number: s.step_number,
      instruction: s.instruction,
      sort_order: s.sort_order,
    })) ?? [blankStep(1)]
  );

  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragStepIdx, setDragStepIdx] = useState<number | null>(null);
  const [dragOverStepIdx, setDragOverStepIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setUploadingImage(true);
    try {
      const url = await uploadRecipeImage(file);
      setImageUrl(url);
      setImagePreview(url);
    } catch {
      addToast(t.imageUploadFailed, 'error');
      setImagePreview('');
      setImageUrl('');
    } finally {
      setUploadingImage(false);
    }
  }, [addToast, t.imageUploadFailed]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const addIngredient = () =>
    setIngredients((prev) => [...prev, blankIngredient(prev.length)]);

  const removeIngredient = (idx: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx));

  const updateIngredient = (idx: number, patch: Partial<IngredientDraft>) =>
    setIngredients((prev) => prev.map((ing, i) => i === idx ? { ...ing, ...patch } : ing));

  const addStep = () =>
    setSteps((prev) => [...prev, blankStep(prev.length + 1)]);

  const removeStep = (idx: number) =>
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1, sort_order: i })));

  const updateStep = (idx: number, instruction: string) =>
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, instruction } : s));

  // Drag reorder steps
  const handleStepDragStart = (idx: number) => setDragStepIdx(idx);
  const handleStepDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverStepIdx(idx);
  };
  const handleStepDrop = (targetIdx: number) => {
    if (dragStepIdx === null || dragStepIdx === targetIdx) {
      setDragStepIdx(null);
      setDragOverStepIdx(null);
      return;
    }
    setSteps((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragStepIdx, 1);
      next.splice(targetIdx, 0, removed);
      return next.map((s, i) => ({ ...s, step_number: i + 1, sort_order: i }));
    });
    setDragStepIdx(null);
    setDragOverStepIdx(null);
  };

  const handleSave = async () => {
    if (!title.trim()) { addToast(t.titleRequired, 'error'); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description,
      category,
      difficulty,
      prep_time_minutes: prepTime,
      cook_time_minutes: cookTime,
      portions,
      notes,
      tags,
      allergens,
      labels,
      image_url: imageUrl,
      is_favorite: recipe?.is_favorite ?? false,
      is_archived: false,
    };
    const filteredIngredients = ingredients.filter((i) => i.name.trim());
    const filteredSteps = steps.filter((s) => s.instruction.trim());

    try {
      if (isEdit && recipe) {
        await updateRecipe(recipe.id, payload, filteredIngredients, filteredSteps);
        addToast(t.recipeUpdated);
      } else {
        await createRecipe(payload, filteredIngredients, filteredSteps);
        addToast(t.recipeCreated);
      }
      onSave();
    } catch {
      addToast(t.failedToSaveRecipe, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay"
      style={{ background: 'rgba(61,44,30,0.55)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="modal-content relative w-full sm:max-w-2xl overflow-hidden"
        style={{
          background: 'var(--color-bg)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-card)' }}
        >
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
            {isEdit ? t.editRecipe : t.newRecipe}
          </h2>
          <button className="btn-ghost p-1.5" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>{t.photo}</label>
            <div
              className="relative rounded-xl overflow-hidden cursor-pointer"
              style={{
                height: 160,
                border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: dragOver ? 'var(--color-accent-light)' : 'var(--color-surface)',
                transition: 'all 0.15s',
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(61,44,30,0.4)' }}>
                    <Upload size={20} color="white" />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Upload size={20} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {uploadingImage ? t.uploading : t.dropImageOrClick}
                  </span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
          </div>

          {/* Basic info */}
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.recipeTitleWithStar}</label>
              <input className="input-base" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.recipeNamePlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.description}</label>
              <textarea className="input-base resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.shortDescription} />
            </div>
          </div>

          {/* Category, Difficulty, Times, Portions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.category}</label>
              <div className="relative">
                <select
                  className="input-base appearance-none pr-8"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">{t.selectPlaceholder}</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.difficulty}</label>
              <div className="relative">
                <select
                  className="input-base appearance-none pr-8"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Recipe['difficulty'])}
                >
                  {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.prepMin}</label>
              <input className="input-base" type="number" min={0} value={prepTime} onChange={(e) => setPrepTime(+e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.cookMin}</label>
              <input className="input-base" type="number" min={0} value={cookTime} onChange={(e) => setCookTime(+e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.portions}</label>
              <input className="input-base" type="number" min={1} value={portions} onChange={(e) => setPortions(+e.target.value)} />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)', fontFamily: 'Playfair Display, serif', fontSize: '1rem' }}>
                {t.ingredients}
              </label>
              <button type="button" className="btn-secondary py-1.5 px-3 text-xs" onClick={addIngredient}>
                <Plus size={12} />
                {t.addIngredient}
              </button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    className="input-base flex-1"
                    placeholder={t.ingredientName}
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, { name: e.target.value })}
                  />
                  <input
                    className="input-base"
                    style={{ width: 70 }}
                    type="number"
                    min={0}
                    placeholder={t.qty}
                    value={ing.amount || ''}
                    onChange={(e) => updateIngredient(idx, { amount: parseFloat(e.target.value) || 0 })}
                  />
                  <div className="relative" style={{ width: 80 }}>
                    <select
                      className="input-base appearance-none pr-6"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(idx, { unit: e.target.value })}
                    >
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <button
                    type="button"
                    className="btn-ghost p-2"
                    onClick={() => removeIngredient(idx)}
                    style={{ color: '#c4584a', flexShrink: 0 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)', fontFamily: 'Playfair Display, serif', fontSize: '1rem' }}>
                {t.cookingStepsHeading}
              </label>
              <button type="button" className="btn-secondary py-1.5 px-3 text-xs" onClick={addStep}>
                <Plus size={12} />
                {t.add}
              </button>
            </div>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 items-start rounded-xl p-2"
                  draggable
                  onDragStart={() => handleStepDragStart(idx)}
                  onDragOver={(e) => handleStepDragOver(e, idx)}
                  onDrop={() => handleStepDrop(idx)}
                  onDragEnd={() => { setDragStepIdx(null); setDragOverStepIdx(null); }}
                  style={{
                    background: dragOverStepIdx === idx ? 'var(--color-accent-light)' : 'transparent',
                    border: `1.5px solid ${dragOverStepIdx === idx ? 'var(--color-accent)' : 'transparent'}`,
                    transition: 'all 0.1s',
                  }}
                >
                  <div className="drag-handle mt-2.5 text-gray-300" style={{ color: 'var(--color-text-light)' }}>
                    <GripVertical size={16} />
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-1.5"
                    style={{ background: 'var(--color-accent)', color: 'white' }}
                  >
                    {step.step_number}
                  </div>
                  <textarea
                    className="input-base resize-none flex-1"
                    rows={2}
                    placeholder={`${t.stepInstructionHint} ${step.step_number}…`}
                    value={step.instruction}
                    onChange={(e) => updateStep(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-ghost p-2 mt-1"
                    onClick={() => removeStep(idx)}
                    style={{ color: '#c4584a', flexShrink: 0 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.notes}</label>
            <textarea className="input-base resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.anyTipsOrVariations} />
          </div>

          {/* Tags, Allergens, Labels */}
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.tags}</label>
              <TagInput tags={tags} onChange={setTags} placeholder={t.tagsList} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.allergens}</label>
              <TagInput tags={allergens} onChange={setAllergens} placeholder={t.allergensList} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{t.recipeLabels}</label>
              <TagInput tags={labels} onChange={setLabels} placeholder={t.labelsList} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 py-4"
          style={{ borderTop: '1px solid var(--color-border-light)', background: 'var(--color-card)' }}
        >
          <button className="btn-secondary flex-1 justify-center" onClick={onCancel}>{t.cancel}</button>
          <button
            className="btn-primary flex-1 justify-center"
            onClick={handleSave}
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? t.saving : isEdit ? t.saveChanges : t.createRecipe}
          </button>
        </div>
      </div>
    </div>
  );
}
