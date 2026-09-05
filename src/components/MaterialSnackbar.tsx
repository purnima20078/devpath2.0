import React from 'react';
import { MaterialSymbols } from './MaterialSymbols';

export interface SnackbarState {
  isOpen: boolean;
  message: string;
  type?: 'info' | 'error' | 'success';
}

interface MaterialSnackbarProps {
  state: SnackbarState;
  onClose: () => void;
}

export const MaterialSnackbar: React.FC<MaterialSnackbarProps> = ({ state, onClose }) => {
  if (!state.isOpen) return null;

  const isError = state.type === 'error';
  const isSuccess = state.type === 'success';

  return (
    <div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-lg px-4"
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
          isError
            ? 'bg-[#FCE8E6] text-[#601410] border-[#F2B8B5] dark:bg-[#601410] dark:text-[#FCE8E6] dark:border-[#8C1D18]'
            : isSuccess
            ? 'bg-[#CEEAD6] text-[#073B14] border-[#A8DAB5] dark:bg-[#073B14] dark:text-[#CEEAD6] dark:border-[#14532D]'
            : 'bg-[#303030] text-white border-transparent'
        }`}
      >
        <MaterialSymbols
          icon={isError ? 'error' : isSuccess ? 'check_circle' : 'info'}
          size={20}
          className={
            isError
              ? 'text-[#D93025] dark:text-[#F2B8B5]'
              : isSuccess
              ? 'text-[#188038] dark:text-[#6DD58C]'
              : 'text-[#8AB4F8]'
          }
          fill
        />
        <span className="leading-snug">{state.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Dismiss message"
        >
          <MaterialSymbols icon="close" size={18} />
        </button>
      </div>
    </div>
  );
};
