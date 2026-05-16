import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Send, X, CreditCard as Edit2, ShoppingCart } from 'lucide-react';
import type { ShoppingItem } from '../lib/database.types';
import {
  fetchShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  clearCompletedItems,
} from '../lib/api';
import { getAllSettings } from '../lib/api';
import { formatShoppingListForTelegram, sendToTelegram } from '../lib/telegram';
import { translations } from '../lib/i18n';

interface ShoppingPageProps {
  addToast: (msg: string, type?: 'success' | 'error') => void;
}

interface ItemFormState {
  name: string;
  quantity: string;
  unit: string;
  note: string;
}

const blank = (): ItemFormState => ({ name: '', quantity: '', unit: '', note: '' });

export default function ShoppingPage({ addToast }: ShoppingPageProps) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ItemFormState>(blank());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemFormState>(blank());
  const [sendingTg, setSendingTg] = useState(false);
  const t = translations.uk;

  const load = async () => {
    setLoading(true);
    const data = await fetchShoppingItems().catch(() => []);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const item = await createShoppingItem({
      name: form.name.trim(),
      quantity: form.quantity,
      unit: form.unit,
      note: form.note,
      is_completed: false,
    }).catch(() => null);
    if (item) {
      setItems((prev) => [...prev, item]);
      setForm(blank());
      setShowForm(false);
    } else {
      addToast(t.failedToAddShoppingItem, 'error');
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    const next = !item.is_completed;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_completed: next } : i));
    await updateShoppingItem(item.id, { is_completed: next }).catch(() => {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_completed: item.is_completed } : i));
    });
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteShoppingItem(id).catch(() => addToast(t.failedToDelete, 'error'));
  };

  const startEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, quantity: item.quantity, unit: item.unit, note: item.note });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setItems((prev) =>
      prev.map((i) => i.id === editingId ? { ...i, name: editForm.name, quantity: editForm.quantity, unit: editForm.unit, note: editForm.note } : i)
    );
    await updateShoppingItem(editingId, {
      name: editForm.name,
      quantity: editForm.quantity,
      unit: editForm.unit,
      note: editForm.note,
    }).catch(() => addToast(t.failedToUpdate, 'error'));
    setEditingId(null);
  };

  const handleClearCompleted = async () => {
    const done = items.filter((i) => i.is_completed);
    if (done.length === 0) return;
    setItems((prev) => prev.filter((i) => !i.is_completed));
    await clearCompletedItems().catch(() => { load(); addToast(t.failedToClear, 'error'); });
    addToast(t.clearedCompletedItems);
  };

  const handleSendTelegram = async () => {
    if (items.length === 0) { addToast(t.shoppingListIsEmpty, 'error'); return; }
    const settings = await getAllSettings().catch(() => ({} as Record<string, string>));
    const botToken = settings['telegram_bot_token'];
    const chatId = settings['telegram_chat_id'];
    if (!botToken || !chatId) {
      addToast(t.configureTelegramInSettings, 'error');
      return;
    }
    setSendingTg(true);
    try {
      const text = formatShoppingListForTelegram(items);
      await sendToTelegram(botToken, chatId, text);
      addToast(t.shoppingListSentToTelegram);
    } catch {
      addToast(t.failedToSendTelegram, 'error');
    } finally {
      setSendingTg(false);
    }
  };

  const pending = items.filter((i) => !i.is_completed);
  const completed = items.filter((i) => i.is_completed);

  const remainingLabel = pending.length === 1
    ? `${pending.length} ${t.itemRemaining}`
    : `${pending.length} ${t.itemsRemaining}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            {t.shoppingListTitle}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {remainingLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary py-2 px-3"
            onClick={handleSendTelegram}
            disabled={sendingTg}
            style={{ opacity: sendingTg ? 0.7 : 1 }}
          >
            <Send size={14} />
            {sendingTg ? t.sendingDots : t.send}
          </button>
          <button className="btn-primary py-2 px-3" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            {t.add}
          </button>
        </div>
      </div>

      {showForm && (
        <div
          className="card p-4 mb-4 animate-slide-in"
          style={{ border: '1.5px solid var(--color-accent-muted)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t.newItem}</span>
            <button className="btn-ghost p-1" onClick={() => { setShowForm(false); setForm(blank()); }}>
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <input
              className="input-base"
              placeholder={t.shoppingItemNamePlaceholder}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input-base"
                placeholder={t.shoppingQtyPlaceholder}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              <input
                className="input-base"
                placeholder={t.shoppingUnitPlaceholder}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <input
              className="input-base"
              placeholder={t.shoppingNotePlaceholder}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
            <button className="btn-primary w-full justify-center" onClick={handleAdd}>
              {t.addItem}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse" style={{ height: 60 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center">
          <ShoppingCart size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-light)' }} />
          <p className="font-medium mb-1" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-text-secondary)' }}>
            {t.yourListIsEmpty}
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>{t.addItemsToGetStarted}</p>
          <button className="btn-primary py-2 px-4" onClick={() => setShowForm(true)}>
            <Plus size={14} /> {t.addItem}
          </button>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-2 mb-4">
              {pending.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  editForm={editForm}
                  onEditFormChange={setEditForm}
                  onToggle={() => handleToggle(item)}
                  onDelete={() => handleDelete(item.id)}
                  onStartEdit={() => startEdit(item)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingId(null)}
                />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {t.completed} ({completed.length})
                </span>
                <button className="btn-ghost py-1 px-2 text-xs" onClick={handleClearCompleted}>
                  <Trash2 size={11} /> {t.clearCompleted}
                </button>
              </div>
              <div className="space-y-2 opacity-70">
                {completed.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isEditing={false}
                    editForm={editForm}
                    onEditFormChange={setEditForm}
                    onToggle={() => handleToggle(item)}
                    onDelete={() => handleDelete(item.id)}
                    onStartEdit={() => startEdit(item)}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingId(null)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ItemRowProps {
  item: ShoppingItem;
  isEditing: boolean;
  editForm: ItemFormState;
  onEditFormChange: (f: ItemFormState) => void;
  onToggle: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

function ItemRow({
  item,
  isEditing,
  editForm,
  onEditFormChange,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: ItemRowProps) {
  const t = translations.uk;

  if (isEditing) {
    return (
      <div className="card p-3 animate-slide-in" style={{ border: '1.5px solid var(--color-accent-muted)' }}>
        <div className="grid gap-2">
          <input
            className="input-base"
            value={editForm.name}
            onChange={(e) => onEditFormChange({ ...editForm, name: e.target.value })}
            placeholder={t.shoppingItemNameEditPlaceholder}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input-base"
              value={editForm.quantity}
              onChange={(e) => onEditFormChange({ ...editForm, quantity: e.target.value })}
              placeholder={t.shoppingQtyPlaceholder}
            />
            <input
              className="input-base"
              value={editForm.unit}
              onChange={(e) => onEditFormChange({ ...editForm, unit: e.target.value })}
              placeholder={t.unit}
            />
          </div>
          <input
            className="input-base"
            value={editForm.note}
            onChange={(e) => onEditFormChange({ ...editForm, note: e.target.value })}
            placeholder={t.itemNote}
          />
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 justify-center py-2" onClick={onCancelEdit}>{t.cancel}</button>
            <button className="btn-primary flex-1 justify-center py-2" onClick={onSaveEdit}>{t.save}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card flex items-center gap-3 px-4 py-3"
      style={{ transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; }}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
        style={{
          border: `2px solid ${item.is_completed ? 'var(--color-success)' : 'var(--color-border)'}`,
          background: item.is_completed ? 'var(--color-success)' : 'transparent',
        }}
      >
        {item.is_completed && <Check size={12} color="white" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium"
          style={{
            color: item.is_completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            textDecoration: item.is_completed ? 'line-through' : 'none',
          }}
        >
          {item.name}
          {(item.quantity || item.unit) && (
            <span className="ml-1 text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>
              — {[item.quantity, item.unit].filter(Boolean).join(' ')}
            </span>
          )}
        </div>
        {item.note && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-light)' }}>{item.note}</div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button className="btn-ghost p-1.5" onClick={onStartEdit}>
          <Edit2 size={13} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        <button className="btn-ghost p-1.5" onClick={onDelete}>
          <Trash2 size={13} style={{ color: '#c4584a' }} />
        </button>
      </div>
    </div>
  );
}
