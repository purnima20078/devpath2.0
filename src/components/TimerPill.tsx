import React from 'react';
import { MaterialSymbols } from './MaterialSymbols';

interface TimerPillProps {
  secondsLeft: number;
  totalSeconds: number;
}

export const TimerPill: React.FC<TimerPillProps> = ({ secondsLeft }) => {
  const safeSeconds = Math.max(0, secondsLeft);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Color escalation:
  // <= 10s: Red (--md-error)
  // <= 25s: Amber (--md-tertiary)
  // > 25s: Neutral surface container
  let containerStyles = 'bg-surface-container-high border-outline text-on-surface';
  let iconColor = 'text-primary';

  if (safeSeconds <= 10) {
    containerStyles = 'bg-[#FCE8E6] border-[#F2B8B5] text-[#D93025] dark:bg-[#8C1D18] dark:text-[#FCE8E6] dark:border-[#F2B8B5]';
    iconColor = 'text-[#D93025] dark:text-[#FCE8E6]';
  } else if (safeSeconds <= 25) {
    containerStyles = 'bg-[#FEF0CD] border-[#FDD663] text-[#B06000] dark:bg-[#5C3800] dark:text-[#FFE082] dark:border-[#B06000]';
    iconColor = 'text-[#B06000] dark:text-[#FFE082]';
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-xs transition-colors duration-500 select-none ${containerStyles}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <MaterialSymbols icon="timer" size={18} className={iconColor} />
      <span className="text-xs tracking-wider uppercase font-medium text-on-surface-variant">
        Time Left:
      </span>
      <span className="font-mono-digits font-bold text-base tracking-widest">
        {timeString}
      </span>
    </div>
  );
};
