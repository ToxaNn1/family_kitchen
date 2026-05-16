import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className="animate-slide-in flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
      style={{
        background: toast.type === 'success' ? '#e8f5e8' : '#fee8e8',
        border: `1px solid ${toast.type === 'success' ? '#c0dcc0' : '#f0c0c0'}`,
        color: toast.type === 'success' ? '#2a6a2a' : '#9a2a2a',
        minWidth: 240,
      }}
    >
      {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} style={{ opacity: 0.6 }}>
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
