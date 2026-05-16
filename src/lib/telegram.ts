import type { Recipe, ShoppingItem } from './database.types';

function difficultyUk(value: string | undefined | null): string {
  if (value === 'easy') return 'Легко';
  if (value === 'medium') return 'Середньо';
  if (value === 'hard') return 'Складно';
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatRecipeForTelegram(recipe: Recipe): string {
  const lines: string[] = [];
  lines.push(`🍽 *${escapeMarkdown(recipe.title)}*`);
  if (recipe.category) lines.push(`📂 ${escapeMarkdown(recipe.category)}`);

  const timeParts: string[] = [];
  if (recipe.prep_time_minutes) timeParts.push(`Підготовка: ${recipe.prep_time_minutes} хв`);
  if (recipe.cook_time_minutes) timeParts.push(`Готування: ${recipe.cook_time_minutes} хв`);
  if (timeParts.length) lines.push(`⏱ ${timeParts.join(' · ')}`);
  if (recipe.portions) lines.push(`🍴 Порції: ${recipe.portions}`);
  if (recipe.difficulty) lines.push(`📊 Складність: ${escapeMarkdown(difficultyUk(recipe.difficulty))}`);

  lines.push('');

  if (recipe.ingredients && recipe.ingredients.length > 0) {
    lines.push('*Інгредієнти:*');
    recipe.ingredients.forEach((ing) => {
      const amount = ing.amount ? `${ing.amount} ${ing.unit}`.trim() : '';
      lines.push(`• ${escapeMarkdown(ing.name)}${amount ? ` — ${escapeMarkdown(amount)}` : ''}`);
    });
    lines.push('');
  }

  if (recipe.steps && recipe.steps.length > 0) {
    lines.push('*Кроки:*');
    recipe.steps.forEach((step) => {
      lines.push(`${step.step_number}\\. ${escapeMarkdown(step.instruction)}`);
    });
    lines.push('');
  }

  if (recipe.notes) {
    lines.push(`📝 _${escapeMarkdown(recipe.notes)}_`);
  }

  return lines.join('\n');
}

export function formatShoppingListForTelegram(items: ShoppingItem[]): string {
  const lines: string[] = [];
  lines.push('🛒 *Список покупок*');
  lines.push('');

  const pending = items.filter((i) => !i.is_completed);
  const done = items.filter((i) => i.is_completed);

  pending.forEach((item) => {
    const qty = [item.quantity, item.unit].filter(Boolean).join(' ');
    lines.push(`• ${escapeMarkdown(item.name)}${qty ? ` — ${escapeMarkdown(qty)}` : ''}`);
    if (item.note) lines.push(`  _${escapeMarkdown(item.note)}_`);
  });

  if (done.length > 0) {
    lines.push('');
    lines.push('✅ *Уже є:*');
    done.forEach((item) => {
      lines.push(`~${escapeMarkdown(item.name)}~`);
    });
  }

  return lines.join('\n');
}

export async function sendToTelegram(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  const token = botToken.trim();
  const chat = chatId.trim();
  const message = text.trim();

  if (!token || !chat) {
    throw new Error('Потрібні токен бота та ID чату');
  }
  if (!message) {
    throw new Error('Текст повідомлення порожній');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: message }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { description?: string };
    throw new Error(err.description ?? 'Помилка API Telegram');
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}
