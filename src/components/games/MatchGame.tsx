import React, { useState, useEffect } from 'react';
import { MatchPairItem } from '../../types';
import { MaterialSymbols } from '../MaterialSymbols';

interface MatchGameProps {
  pairs: MatchPairItem[];
  onComplete: (score: number, correctCount: number, incorrectCount: number) => void;
  disabled?: boolean;
}

export const MatchGame: React.FC<MatchGameProps> = ({
  pairs,
  onComplete,
  disabled = false,
}) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<{ leftId: string; rightId: string } | null>(null);
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [mistakesCount, setMistakesCount] = useState<number>(0);

  // Randomize right-hand options once
  const [shuffledRight, setShuffledRight] = useState<Array<{ id: string; text: string }>>([]);

  useEffect(() => {
    const rights = pairs.map((p) => ({ id: p.id, text: p.right }));
    // Deterministic shuffle
    const shuffled = [...rights].sort(() => Math.random() - 0.5);
    setShuffledRight(shuffled);
  }, [pairs]);

  // Check match when both sides are selected
  useEffect(() => {
    if (!selectedLeft || !selectedRight) return;

    setAttemptsCount((prev) => prev + 1);

    if (selectedLeft === selectedRight) {
      // Correct match!
      const newMatched = [...matchedIds, selectedLeft];
      setMatchedIds(newMatched);
      setSelectedLeft(null);
      setSelectedRight(null);

      // Check if all pairs matched
      if (newMatched.length === pairs.length) {
        setTimeout(() => {
          onComplete(newMatched.length, newMatched.length, mistakesCount);
        }, 600);
      }
    } else {
      // Incorrect match
      setMistakesCount((prev) => prev + 1);
      setWrongPair({ leftId: selectedLeft, rightId: selectedRight });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 700);
    }
  }, [selectedLeft, selectedRight, matchedIds, pairs.length, mistakesCount, onComplete]);

  const handleLeftClick = (id: string) => {
    if (disabled || matchedIds.includes(id) || wrongPair) return;
    setSelectedLeft(id === selectedLeft ? null : id);
  };

  const handleRightClick = (id: string) => {
    if (disabled || matchedIds.includes(id) || wrongPair) return;
    setSelectedRight(id === selectedRight ? null : id);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between w-full bg-surface-container px-5 py-3 rounded-2xl border border-outline-variant mb-6 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-medium text-on-surface">
          <MaterialSymbols icon="touch_app" size={20} className="text-primary" />
          <span>Tap one item from the left, then its match on the right</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-mono-digits font-bold text-sm">
          <span>{matchedIds.length} / {pairs.length} Matched</span>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
        {/* Left column (Concepts) */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1 mb-1">
            Tech Concept
          </h3>
          {pairs.map((pair) => {
            const isMatched = matchedIds.includes(pair.id);
            const isSelected = selectedLeft === pair.id;
            const isWrong = wrongPair?.leftId === pair.id;

            let cardStyles = 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container';
            if (isMatched) {
              cardStyles = 'bg-[#CEEAD6] border-[#A8DAB5] text-[#073B14] dark:bg-[#14532D] dark:text-[#CEEAD6] dark:border-[#14532D] opacity-90';
            } else if (isWrong) {
              cardStyles = 'bg-[#FCE8E6] border-[#F2B8B5] text-[#D93025] animate-shake';
            } else if (isSelected) {
              cardStyles = 'bg-primary-container border-primary text-on-primary-container font-semibold ring-2 ring-primary/30 shadow-md';
            }

            return (
              <button
                key={pair.id}
                type="button"
                disabled={disabled || isMatched}
                onClick={() => handleLeftClick(pair.id)}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl text-left border text-sm sm:text-base font-medium transition-all duration-150 select-none ${cardStyles} ${
                  isMatched ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'
                }`}
              >
                <span>{pair.left}</span>
                {isMatched ? (
                  <MaterialSymbols icon="check_circle" size={20} className="text-[#188038] dark:text-[#6DD58C]" fill />
                ) : isSelected ? (
                  <MaterialSymbols icon="arrow_forward" size={18} className="text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Right column (Functions) */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1 mb-1">
            Core Function
          </h3>
          {shuffledRight.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedRight === item.id;
            const isWrong = wrongPair?.rightId === item.id;

            let cardStyles = 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container';
            if (isMatched) {
              cardStyles = 'bg-[#CEEAD6] border-[#A8DAB5] text-[#073B14] dark:bg-[#14532D] dark:text-[#CEEAD6] dark:border-[#14532D] opacity-90';
            } else if (isWrong) {
              cardStyles = 'bg-[#FCE8E6] border-[#F2B8B5] text-[#D93025] animate-shake';
            } else if (isSelected) {
              cardStyles = 'bg-primary-container border-primary text-on-primary-container font-semibold ring-2 ring-primary/30 shadow-md';
            }

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled || isMatched}
                onClick={() => handleRightClick(item.id)}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl text-left border text-sm sm:text-base font-medium transition-all duration-150 select-none ${cardStyles} ${
                  isMatched ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'
                }`}
              >
                <span>{item.text}</span>
                {isMatched ? (
                  <MaterialSymbols icon="check_circle" size={20} className="text-[#188038] dark:text-[#6DD58C]" fill />
                ) : isSelected ? (
                  <MaterialSymbols icon="arrow_back" size={18} className="text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
