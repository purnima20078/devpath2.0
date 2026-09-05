import React from 'react';
import { Question } from '../../types';
import { MaterialSymbols } from '../MaterialSymbols';

interface RapidFireGameProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  disabled?: boolean;
}

export const RapidFireGame: React.FC<RapidFireGameProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Rapid Fire Prompt Card */}
      <div className="w-full bg-surface-container rounded-3xl p-6 sm:p-8 mb-6 border border-outline-variant shadow-xs">
        <div className="flex items-center gap-2 text-primary text-xs uppercase font-bold tracking-widest mb-3">
          <MaterialSymbols icon="bolt" size={18} fill />
          <span>Quick Awareness</span>
        </div>
        <h2 className="text-lg sm:text-xl font-medium text-on-surface leading-snug">
          {question.question}
        </h2>
      </div>

      {/* 4 Fast Options */}
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
