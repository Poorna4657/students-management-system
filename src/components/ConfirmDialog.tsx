import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
          <AlertTriangle className="h-5 w-5 text-error-600 dark:text-error-400" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button onClick={onConfirm} className="btn-danger" disabled={loading}>
          {loading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    loading: boolean;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    loading: false,
  });

  const confirm = (opts: { title: string; message: string; onConfirm: () => Promise<void> }) => {
    setState({
      open: true,
      title: opts.title,
      message: opts.message,
      onConfirm: () => {
        setState((s) => ({ ...s, loading: true }));
        opts.onConfirm().finally(() => {
          setState((s) => ({ ...s, open: false, loading: false }));
        });
      },
      loading: false,
    });
  };

  const close = () => setState((s) => ({ ...s, open: false, loading: false }));

  return { state, confirm, close };
}
