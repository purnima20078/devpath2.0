import React from 'react';
import { GameAttempt, UserSession } from '../types';
import { GAME_DEFINITIONS } from '../data/gamesData';
import { MaterialSymbols } from './MaterialSymbols';

interface StudentResultViewProps {
  session: UserSession;
  attempt: GameAttempt;
  onBackToDashboard: () => void;
}

export const StudentResultView: React.FC<StudentResultViewProps> = ({
  session,
  attempt,
  onBackToDashboard,
}) => {
  const game = GAME_DEFINITIONS[attempt.gameId];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = Math.round((attempt.score / Math.max(1, attempt.totalQuestions)) * 100);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-4">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <MaterialSymbols icon="arrow_back" size={20} />
          <span>Back to Hall Overview</span>
        </button>
      </div>

      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-outline-variant shadow-md text-center">
        {/* Completion Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#CEEAD6] text-[#073B14] dark:bg-[#14532D] dark:text-[#CEEAD6] text-sm font-semibold mb-6">
          <MaterialSymbols icon="verified" size={20} fill />
          <span>Game Completed</span>
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl text-on-surface mb-2">
          {game?.name || 'Game'} Finished!
        </h1>
        <p className="text-sm text-on-surface-variant mb-8">
          Orientation Program 2026  •  {session.hallName}
        </p>

        {/* Hero Score Badge */}
        <div className="my-6 flex justify-center">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-primary-container text-on-primary-container flex flex-col items-center justify-center p-4 shadow-inner ring-4 ring-primary/20">
            <span className="text-xs uppercase tracking-widest font-bold text-primary mb-1">
              Your Score
            </span>
            <div className="font-display font-black text-4xl sm:text-5xl leading-none">
              {attempt.score}
              <span className="text-xl sm:text-2xl font-normal opacity-80">
                /{attempt.totalQuestions}
              </span>
            </div>
            <span className="mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary text-on-primary">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-8">
          <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant text-center">
            <span className="text-xs text-on-surface-variant font-medium block mb-1">Correct</span>
            <span className="font-display text-lg font-bold text-[#188038] dark:text-[#6DD58C]">
              {attempt.correctAnswers}
            </span>
          </div>
          <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant text-center">
            <span className="text-xs text-on-surface-variant font-medium block mb-1">Incorrect</span>
            <span className="font-display text-lg font-bold text-[#D93025] dark:text-[#F2B8B5]">
              {attempt.incorrectAnswers}
            </span>
          </div>
          <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant text-center">
            <span className="text-xs text-on-surface-variant font-medium block mb-1">Time Taken</span>
            <span className="font-mono-digits text-lg font-bold text-on-surface">
              {formatTime(attempt.timeTaken)}
            </span>
          </div>
          <div className="bg-surface-container p-3.5 rounded-2xl border border-outline-variant text-center">
            <span className="text-xs text-on-surface-variant font-medium block mb-1">Status</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {attempt.status === 'completed' ? 'Completed' : 'Stopped'}
            </span>
          </div>
        </div>

        {/* Session Metadata Card */}
        <div className="bg-surface-container-high rounded-2xl p-4 text-xs sm:text-sm text-left border border-outline-variant space-y-2 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Admission Number:</span>
            <span className="font-mono-digits font-bold text-on-surface">{session.username}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Seminar Hall:</span>
            <span className="font-medium text-on-surface">{session.hallName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant">Completed At:</span>
            <span className="font-medium text-on-surface">
              {attempt.completedAt ? new Date(attempt.completedAt).toLocaleTimeString() : 'Just now'}
            </span>
          </div>
        </div>

        {/* Mandatory Replay Notice */}
        <div className="bg-[#FEF0CD] border border-[#FDD663] text-[#493300] dark:bg-[#5C3800]/50 dark:border-[#B06000] dark:text-[#FFE082] px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 mb-8">
          <MaterialSymbols icon="lock" size={18} fill />
          <span>You have completed this game. Replay is not allowed.</span>
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={onBackToDashboard}
          className="w-full sm:w-auto px-8 py-3 rounded-full m3-btn-primary inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <MaterialSymbols icon="dashboard" size={20} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
