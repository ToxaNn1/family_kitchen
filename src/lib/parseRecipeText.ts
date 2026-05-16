import type { Recipe } from './database.types';
import { CATEGORIES, UNITS } from './constants';

type IngredientDraft = { name: string; amount: number; unit: string; sort_order: number };
type StepDraft = { step_number: number; instruction: string; sort_order: number };

export interface ParsedRecipeDraft {
  title: string;
  description: string;
  category: string;
  difficulty: Recipe['difficulty'];
  prep_time_minutes: number;
  cook_time_minutes: number;
  portions: number;
  notes: string;
  tags: string[];
  allergens: string[];
  labels: string[];
  ingredients: IngredientDraft[];
  steps: StepDraft[];
}

const CATEGORY_SET = new Set<string>(CATEGORIES);
const UNIT_SET = new Set<string>(UNITS);
const DIFFICULTIES = new Set<Recipe['difficulty']>(['easy', 'medium', 'hard']);

function buildSystemPrompt(): string {
  return `Ти парсер рецептів для сімейної кулінарної книги. Отримуєш довільний текст рецепту (українською або змішано) і повертаєш ТІЛЬКИ валідний JSON без markdown.

Схема відповіді:
{
  "title": "string — коротка назва страви",
  "description": "string — 1–3 речення опису",
  "category": "string — рівно одне з: ${CATEGORIES.join(', ')}; якщо неочевидно — Інше",
  "difficulty": "easy | medium | hard",
  "prep_time_minutes": number,
  "cook_time_minutes": number,
  "portions": number,
  "notes": "string — поради, варіації, що не влізло в кроки",
  "tags": ["string"],
  "allergens": ["string"],
  "labels": ["string"],
  "ingredients": [{ "name": "string", "amount": number, "unit": "string" }],
  "steps": [{ "instruction": "string" }]
}

Правила:
- amount — число; дроби як 1.5; якщо кількості немає — 0.
- unit — одне з: ${UNITS.join(', ')}; інакше найближче (г, мл, ст. л., ч. л., шт).
- Якщо в тексті кілька страв (наприклад 3 піци) — один рецепт: назва охоплює все, інгредієнти об'єднай, кроки по порядку з підзаголовками в instruction.
- Час: оціни з контексту; якщо невідомо — 0.
- tags/allergens/labels — лише якщо явно згадано або логічно (глютен, молочні, піца).
- steps — чіткі кроки приготування; emoji можна прибрати.`;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeCategory(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (CATEGORY_SET.has(trimmed)) return trimmed;
  const match = CATEGORIES.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? 'Інше';
}

function normalizeDifficulty(value: unknown): Recipe['difficulty'] {
  if (typeof value === 'string' && DIFFICULTIES.has(value as Recipe['difficulty'])) {
    return value as Recipe['difficulty'];
  }
  return 'easy';
}

function normalizeUnit(value: unknown): string {
  if (typeof value !== 'string') return 'г';
  const trimmed = value.trim();
  if (UNIT_SET.has(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  const match = UNITS.find((u) => u.toLowerCase() === lower);
  return match ?? 'г';
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

function normalizeParsed(raw: Record<string, unknown>): ParsedRecipeDraft {
  const rawIngredients = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  const ingredients: IngredientDraft[] = rawIngredients
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const ing = item as Record<string, unknown>;
      const name = typeof ing.name === 'string' ? ing.name.trim() : '';
      if (!name) return null;
      return {
        name,
        amount: normalizeNumber(ing.amount, 0),
        unit: normalizeUnit(ing.unit),
        sort_order: index,
      };
    })
    .filter((i): i is IngredientDraft => i !== null);

  const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];
  const steps: StepDraft[] = rawSteps
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const step = item as Record<string, unknown>;
      const instruction =
        typeof step.instruction === 'string' ? step.instruction.trim() : '';
      if (!instruction) return null;
      return {
        step_number: index + 1,
        instruction,
        sort_order: index,
      };
    })
    .filter((s): s is StepDraft => s !== null);

  return {
    title: typeof raw.title === 'string' ? raw.title.trim() : '',
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    category: normalizeCategory(raw.category),
    difficulty: normalizeDifficulty(raw.difficulty),
    prep_time_minutes: normalizeNumber(raw.prep_time_minutes, 0),
    cook_time_minutes: normalizeNumber(raw.cook_time_minutes, 0),
    portions: Math.max(1, normalizeNumber(raw.portions, 2)),
    notes: typeof raw.notes === 'string' ? raw.notes.trim() : '',
    tags: normalizeStringArray(raw.tags),
    allergens: normalizeStringArray(raw.allergens),
    labels: normalizeStringArray(raw.labels),
    ingredients: ingredients.length ? ingredients : [{ name: '', amount: 0, unit: 'г', sort_order: 0 }],
    steps: steps.length ? steps : [{ step_number: 1, instruction: '', sort_order: 0 }],
  };
}

export async function parseRecipeFromText(text: string): Promise<ParsedRecipeDraft> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error('OPENAI_KEY_MISSING');
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('EMPTY_TEXT');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: trimmed },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(err || `OPENAI_HTTP_${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('INVALID_RESPONSE');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error('INVALID_JSON');
  }

  const result = normalizeParsed(parsed);
  if (!result.title) {
    throw new Error('NO_TITLE');
  }

  return result;
}
