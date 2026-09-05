import React from 'react';
import { Question } from '../../types';
import { MaterialSymbols } from '../MaterialSymbols';

interface EmojiGameProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  disabled?: boolean;
}

export const EmojiGame: React.FC<EmojiGameProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Hero Emoji Card */}
      <div className="w-full bg-surface-container rounded-3xl p-8 sm:p-12 mb-6 flex flex-col items-center justify-center border border-outline-variant shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          Decode the Emojis
        </span>
        <div className="text-5xl sm:text-6xl tracking-widest py-2 select-none filter drop-shadow-xs">
          {question.emojis}
        </div>
        <p className="mt-4 text-sm text-on-surface-variant text-center font-medium">
          {question.question}
        </p>
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const letter = String.fromCharCode(65 + idx);

          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onSelectAnswer(option)}
              className={`flex items-center gap-3.5 p-4 rounded-2xl text-left border transition-all duration-150 active:scale-[0.98] ${
                isSelected
                  ? 'bg-primary-container text-on-primary-container border-primary font-semibold shadow-xs'
                  : 'bg-surface hover:bg-surface-container text-on-surface border-outline-variant'
              } ${disabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {letter}
              </div>
              <span className="text-base flex-1 leading-snug">{option}</span>
              {isSelected && (
                <MaterialSymbols icon="check_circle" size={20} className="text-primary" fill />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
