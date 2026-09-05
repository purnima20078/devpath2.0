import React from 'react';
import { Question } from '../../types';
import { LogoVector } from '../../data/logoVectors';
import { MaterialSymbols } from '../MaterialSymbols';

interface LogoGameProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  disabled?: boolean;
}

export const LogoGame: React.FC<LogoGameProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Logo Card */}
      <div className="w-full bg-surface-container rounded-3xl p-8 mb-6 flex flex-col items-center justify-center border border-outline-variant shadow-xs">
        <div className="w-28 h-28 flex items-center justify-center transition-transform duration-300 hover:scale-105">
          <LogoVector name={question.svgIcon || 'github'} className="w-24 h-24 drop-shadow-xs" />
        </div>
        <p className="mt-4 text-sm font-medium text-on-surface-variant text-center">
          {question.question}
        </p>
      </div>

      {/* 4 Answer Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const letter = String.fromCharCode(65 + idx); // A, B, C, D

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
