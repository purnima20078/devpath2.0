import React from 'react';
import { Question } from '../../types';
import { MaterialSymbols } from '../MaterialSymbols';

interface AbbreviationGameProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  disabled?: boolean;
}

export const AbbreviationGame: React.FC<AbbreviationGameProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}) => {
  // Extract the abbreviation code from the question, e.g. "What does CPU stand for?" -> "CPU"
  const match = question.question.match(/What does\s+([A-Z0-9-]+)\s+stand for/i);
  const acronym = match ? match[1] : 'TECH';

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Hero Acronym Card */}
      <div className="w-full bg-surface-container rounded-3xl p-8 mb-6 flex flex-col items-center justify-center border border-outline-variant shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
          Abbreviation
        </span>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-on-surface tracking-wider">
          {acronym}
        </h2>
        <p className="mt-3 text-sm text-on-surface-variant text-center font-medium">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 w-full">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const letter = String.fromCharCode(65 + idx);

          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onSelectAnswer(option)}
              className={`flex items-center gap-3.5 p-4 rounded-2xl text-left border transition-all duration-150 active:scale-[0.99] ${
                isSelected
                  ? 'bg-primary-container text-on-primary-container border-primary font-semibold shadow-xs'
                  : 'bg-surface hover:bg-surface-container text-on-surface border-outline-variant'
              } ${disabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {letter}
              </div>
              <span className="text-base flex-1 leading-snug">{option}</span>
              {isSelected && (
                <MaterialSymbols icon="check_circle" size={20} className="text-primary shrink-0" fill />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
