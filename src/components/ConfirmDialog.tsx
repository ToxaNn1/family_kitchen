import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Підтвердити',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay"
      style={{ background: 'rgba(61,44,30,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-content w-full max-w-sm rounded-2xl p-6" style={{ background: 'var(--color-card)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: danger ? '#fee8e8' : 'var(--color-surface)' }}>
            <AlertTriangle size={20} style={{ color: danger ? '#c4584a' : 'var(--color-text-muted)' }} />
          </div>
          <div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'Playfair Display, serif' }}>{title}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary py-2 px-4" onClick={onCancel}>Скасувати</button>
          <button
            className="btn-primary py-2 px-4"
            style={danger ? { background: '#c4584a' } : {}}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
