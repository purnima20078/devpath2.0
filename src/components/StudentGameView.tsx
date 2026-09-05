import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameAttempt,
  GameId,
  Question,
  SeminarHallState,
  UserSession,
} from '../types';
import {
  GAME_DEFINITIONS,
  LOGO_QUESTIONS,
  ABBREVIATION_QUESTIONS,
  APP_QUESTIONS,
  EMOJI_QUESTIONS,
  MATCH_PAIRS,
  RAPID_FIRE_QUESTIONS,
} from '../data/gamesData';
import { submitStudentAttempt } from '../services/gameService';
import { TimerPill } from './TimerPill';
import { MaterialSymbols } from './MaterialSymbols';
import { LogoGame } from './games/LogoGame';
import { AbbreviationGame } from './games/AbbreviationGame';
import { AppGame } from './games/AppGame';
import { EmojiGame } from './games/EmojiGame';
import { MatchGame } from './games/MatchGame';
import { RapidFireGame } from './games/RapidFireGame';
import { StudentResultView } from './StudentResultView';
import { MaterialDialog } from './MaterialDialog';

interface StudentGameViewProps {
  session: UserSession;
  hallState: SeminarHallState | null;
  gameId: GameId;
  initialAttempt?: GameAttempt | null;
  onExit: () => void;
  onShowSnackbar: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

export const StudentGameView: React.FC<StudentGameViewProps> = ({
  session,
  hallState,
  gameId,
  initialAttempt,
  onExit,
  onShowSnackbar,
}) => {
  const gameDef = GAME_DEFINITIONS[gameId];

  // Get question bank for the game
  const questions: Question[] = React.useMemo(() => {
    switch (gameId) {
      case 'LOGO':
        return LOGO_QUESTIONS;
      case 'ABBREVIATION':
        return ABBREVIATION_QUESTIONS;
      case 'APP':
        return APP_QUESTIONS;
      case 'EMOJI':
        return EMOJI_QUESTIONS;
      case 'RAPID_FIRE':
        return RAPID_FIRE_QUESTIONS;
      case 'MATCH':
      default:
        return [];
    }
  }, [gameId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(gameDef.timeLimitSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<GameAttempt | null>(
    initialAttempt?.status === 'completed' ? initialAttempt : null
  );

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittedRef = useRef(false);

  // Calculate final score
  const finalizeSubmission = useCallback(async (isStoppedByAdmin = false) => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    setIsSubmitting(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    if (gameId !== 'MATCH') {
      questions.forEach((q, idx) => {
        const studentAns = userAnswers[idx];
        if (studentAns === q.correctAnswer) {
          score += q.points;
          correctCount += 1;
        } else if (studentAns !== undefined) {
          incorrectCount += 1;
        }
      });
    }

    const totalQuestions = gameId === 'MATCH' ? MATCH_PAIRS.length : questions.length;
    const finalStatus = isStoppedByAdmin ? 'stopped_by_admin' : 'completed';

    try {
      const res = await submitStudentAttempt(
        session.hallId,
        session.username,
        gameId,
        score,
        totalQuestions,
        correctCount,
        incorrectCount,
        elapsedSeconds,
        finalStatus,
        hallState?.currentSessionId
      );

      if (res.success && res.attempt) {
        setCompletedAttempt(res.attempt);
      } else {
        onShowSnackbar(res.error || 'Submission saved with notice.', 'error');
        onExit();
      }
    } catch (err) {
      console.error('Submission error:', err);
      onShowSnackbar('Submission error. Saved locally.', 'error');
      onExit();
    } finally {
      setIsSubmitting(false);
    }
  }, [gameId, hallState?.currentSessionId, onExit, onShowSnackbar, questions, session.hallId, session.username, userAnswers]);

  // Real-time listener check: If admin stops this game while student is playing
  useEffect(() => {
    if (!hallState) return;

    // Check if active game is no longer this game or stopped
    const isStillActive =
      hallState.activeGameId === gameId && hallState.activeGameStatus === 'ACTIVE';

    if (!isStillActive && !isSubmittedRef.current) {
      onShowSnackbar('The administrator has stopped this game.', 'error');
      finalizeSubmission(true);
    }
  }, [hallState, gameId, finalizeSubmission, onShowSnackbar]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finalizeSubmission(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [finalizeSubmission]);

  // Handle Match the Pair completion
  const handleMatchComplete = async (
    score: number,
    correctCount: number,
    incorrectCount: number
  ) => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    try {
      const res = await submitStudentAttempt(
        session.hallId,
        session.username,
        'MATCH',
        score,
        MATCH_PAIRS.length,
        correctCount,
        incorrectCount,
        elapsedSeconds,
        'completed',
        hallState?.currentSessionId
      );
      if (res.success && res.attempt) {
        setCompletedAttempt(res.attempt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already completed, show results directly
  if (completedAttempt) {
    return (
      <StudentResultView
        session={session}
        attempt={completedAttempt}
        onBackToDashboard={onExit}
      />
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercent =
    gameId === 'MATCH'
      ? 100
      : Math.round(((currentIndex + 1) / Math.max(1, questions.length)) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Top Bar: Progress & Timer */}
      <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-outline-variant shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="p-2 -ml-1 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors shrink-0"
            title="Leave Game"
            aria-label="Leave Game"
          >
            <MaterialSymbols icon="arrow_back" size={24} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold shrink-0">
            <MaterialSymbols icon={gameDef.icon} size={22} fill />
          </div>
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
              {gameDef.name}
            </h2>
            {gameId !== 'MATCH' && (
              <span className="text-xs font-semibold text-primary">
                Question {currentIndex + 1} of {questions.length}
              </span>
            )}
          </div>
        </div>

        {/* Prominent Timer Pill */}
        <div className="shrink-0">
          <TimerPill secondsLeft={secondsLeft} totalSeconds={gameDef.timeLimitSeconds} />
        </div>
      </div>

      {/* Linear Progress Bar for quiz games */}
      {gameId !== 'MATCH' && (
        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Game Content Area */}
      <div className="min-h-[380px] flex flex-col justify-between">
        {gameId === 'LOGO' && currentQ && (
          <LogoGame
            question={currentQ}
            selectedAnswer={userAnswers[currentIndex] || null}
            onSelectAnswer={(ans) =>
              setUserAnswers((prev) => ({ ...prev, [currentIndex]: ans }))
            }
            disabled={isSubmitting}
          />
        )}

        {gameId === 'ABBREVIATION' && currentQ && (
          <AbbreviationGame
            question={currentQ}
            selectedAnswer={userAnswers[currentIndex] || null}
            onSelectAnswer={(ans) =>
              setUserAnswers((prev) => ({ ...prev, [currentIndex]: ans }))
            }
            disabled={isSubmitting}
          />
        )}

        {gameId === 'APP' && currentQ && (
          <AppGame
            question={currentQ}
            selectedAnswer={userAnswers[currentIndex] || null}
            onSelectAnswer={(ans) =>
              setUserAnswers((prev) => ({ ...prev, [currentIndex]: ans }))
            }
            disabled={isSubmitting}
          />
        )}

        {gameId === 'EMOJI' && currentQ && (
          <EmojiGame
            question={currentQ}
            selectedAnswer={userAnswers[currentIndex] || null}
            onSelectAnswer={(ans) =>
              setUserAnswers((prev) => ({ ...prev, [currentIndex]: ans }))
            }
            disabled={isSubmitting}
          />
        )}

        {gameId === 'RAPID_FIRE' && currentQ && (
          <RapidFireGame
            question={currentQ}
            selectedAnswer={userAnswers[currentIndex] || null}
            onSelectAnswer={(ans) =>
              setUserAnswers((prev) => ({ ...prev, [currentIndex]: ans }))
            }
            disabled={isSubmitting}
          />
        )}

        {gameId === 'MATCH' && (
          <MatchGame
            pairs={MATCH_PAIRS}
            onComplete={handleMatchComplete}
            disabled={isSubmitting}
          />
        )}

        {/* Bottom Navigation Buttons for Quiz Games */}
        {gameId !== 'MATCH' && (
          <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-outline-variant">
            <button
              type="button"
              disabled={currentIndex === 0 || isSubmitting}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className={`px-5 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2 border border-outline transition-colors ${
                currentIndex === 0
                  ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <MaterialSymbols icon="arrow_back" size={18} />
              <span>Previous</span>
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => finalizeSubmission(false)}
                className={`px-8 py-2.5 rounded-full text-sm font-medium m3-btn-primary inline-flex items-center gap-2 shadow-sm ${
                  isSubmitting ? 'opacity-80 cursor-wait' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Game</span>
                    <MaterialSymbols icon="check" size={18} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                }
                className="px-6 py-2.5 rounded-full text-sm font-medium m3-btn-primary inline-flex items-center gap-2 shadow-xs"
              >
                <span>Next</span>
                <MaterialSymbols icon="arrow_forward" size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Exit Game Confirmation Dialog */}
      <MaterialDialog
        isOpen={showExitConfirm}
        title="Leave Game?"
        message="Are you sure you want to exit this game? Your answers for this attempt will not be saved."
        confirmLabel="Leave Game"
        cancelLabel="Keep Playing"
        isDestructive={true}
        icon="arrow_back"
        onConfirm={() => {
          setShowExitConfirm(false);
          onExit();
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
};
