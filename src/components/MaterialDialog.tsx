import React, { useEffect } from 'react';
import { MaterialSymbols } from './MaterialSymbols';

interface MaterialDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  icon?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const MaterialDialog: React.FC<MaterialDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  isDestructive = false,
  icon = 'info',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-surface text-on-surface rounded-[28px] p-6 shadow-2xl border border-outline-variant transform transition-all duration-200 scale-100">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDestructive
                ? 'bg-[#FCE8E6] text-[#D93025] dark:bg-[#8C1D18] dark:text-[#F2B8B5]'
                : 'bg-primary-container text-on-primary-container'
            }`}
          >
            <MaterialSymbols icon={icon} size={22} fill />
          </div>
          <h2 className="text-xl font-medium tracking-tight">{title}</h2>
        </div>

        <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          {cancelLabel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
              isDestructive
                ? 'bg-[#D93025] text-white hover:bg-[#B3261E] active:bg-[#8C1D18]'
                : 'm3-btn-primary'
            } ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
