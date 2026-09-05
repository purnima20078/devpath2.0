import React, { useState, useEffect } from 'react';
import { GameAttempt, GameId, SeminarHallState, UserSession } from '../types';
import { GAME_DEFINITIONS } from '../data/gamesData';
import { checkStudentAttempt, startStudentAttempt } from '../services/gameService';
import { MaterialSymbols } from './MaterialSymbols';
import { StatusChip } from './StatusChip';
import { StudentGameView } from './StudentGameView';
import { StudentResultView } from './StudentResultView';

interface StudentDashboardProps {
  session: UserSession;
  hallState: SeminarHallState | null;
  onShowSnackbar: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  session,
  hallState,
  onShowSnackbar,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewingResultAttempt, setViewingResultAttempt] = useState<GameAttempt | null>(null);
  const [attemptCheck, setAttemptCheck] = useState<{
    canPlay: boolean;
    reason?: string;
    attempt?: GameAttempt;
  } | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const activeGameId = hallState?.activeGameId;
  const isGameActive = hallState?.activeGameStatus === 'ACTIVE' && Boolean(activeGameId);
  const activeGame = activeGameId ? GAME_DEFINITIONS[activeGameId] : null;

  // Whenever active game changes, check deterministic attempt in Firestore
  useEffect(() => {
    let isMounted = true;
    if (isGameActive && activeGameId) {
      checkStudentAttempt(session.hallId, session.username, activeGameId).then((res) => {
        if (isMounted) {
          setAttemptCheck(res);
        }
      });
    } else {
      setAttemptCheck(null);
      setIsPlaying(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isGameActive, activeGameId, session.hallId, session.username]);

  const handlePlayNow = async () => {
    if (!activeGameId || !activeGame) return;
    setIsStarting(true);

    try {
      // Re-verify against database
      const verify = await checkStudentAttempt(session.hallId, session.username, activeGameId);
      if (!verify.canPlay) {
        setAttemptCheck(verify);
        onShowSnackbar(verify.reason || 'Replay is not allowed.', 'error');
        setIsStarting(false);
        return;
      }

      // Atomically register attempt in Firestore
      const reg = await startStudentAttempt(
        session.hallId,
        session.username,
        activeGameId,
        activeGame.questionCount,
        hallState?.currentSessionId
      );

      if (!reg.success) {
        onShowSnackbar(reg.error || 'Failed to initialize session.', 'error');
        setIsStarting(false);
        return;
      }

      setIsPlaying(true);
    } catch (err) {
      console.error(err);
      onShowSnackbar('Connection error. Please try again.', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  // If currently in active gameplay
  if (isPlaying && activeGameId) {
    return (
      <StudentGameView
        session={session}
        hallState={hallState}
        gameId={activeGameId}
        initialAttempt={attemptCheck?.attempt}
        onExit={() => {
          setIsPlaying(false);
          // Re-check attempt
          checkStudentAttempt(session.hallId, session.username, activeGameId).then(setAttemptCheck);
        }}
        onShowSnackbar={onShowSnackbar}
      />
    );
  }

  // If viewing previous result
  if (viewingResultAttempt) {
    return (
      <StudentResultView
        session={session}
        attempt={viewingResultAttempt}
        onBackToDashboard={() => setViewingResultAttempt(null)}
      />
    );
  }

  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Student Welcome Banner */}
      <section aria-labelledby="welcome-heading" className="bg-surface rounded-3xl p-6 sm:p-8 border border-outline-variant shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-primary block mb-1">
              Student Portal
            </span>
            <h2 id="welcome-heading" className="font-display font-bold text-2xl sm:text-3xl text-on-surface">
              Welcome to Tech Quest
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Orientation technology challenges conducted live in your seminar hall.
            </p>
          </div>

          <div className="bg-surface-container px-4 py-3 rounded-2xl border border-outline-variant shrink-0">
            <div className="text-xs text-on-surface-variant">Your Admission Number</div>
            <div className="font-mono-digits font-bold text-base text-on-surface">
              {session.username}
            </div>
            <div className="text-xs font-semibold text-primary mt-0.5">
              {session.hallName}
            </div>
          </div>
        </div>
      </section>

      {/* Main Game Status View */}
      {!isGameActive ? (
        // Waiting state with subtle indeterminate progress
        <div className="bg-surface rounded-3xl p-10 sm:p-14 border border-outline-variant shadow-xs text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-6 shadow-inner">
            <MaterialSymbols icon="hourglass_empty" size={32} className="animate-spin text-primary" />
          </div>

          <StatusChip status="WAITING" label="Waiting for Game" size="md" />

          <h3 className="font-display font-semibold text-xl sm:text-2xl text-on-surface mt-4 mb-2">
            Waiting for the administrator to start a game...
          </h3>
          <p className="text-on-surface-variant text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Please keep this page open. As soon as the hall coordinator starts a challenge for{' '}
            <strong className="text-on-surface">{session.hallName}</strong>, the Play button will appear automatically.
          </p>

          <div className="w-48 bg-surface-container-high h-1 rounded-full overflow-hidden mt-8">
            <div className="bg-primary h-full rounded-full w-1/3 animate-pulse" />
          </div>
        </div>
      ) : (
        // Game is Active in this Seminar Hall!
        <div className="bg-surface rounded-3xl p-6 sm:p-10 border-2 border-primary shadow-md relative overflow-hidden">
          {/* Top Active Bar */}
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <StatusChip status="ACTIVE" label="Game Live in Your Hall" />
            </div>
            <span className="text-xs font-mono-digits text-on-surface-variant">
              Live updates active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-3xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-xs shrink-0">
              <MaterialSymbols icon={activeGame?.icon || 'sports_esports'} size={40} fill />
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-on-surface">
                {activeGame?.name}
              </h3>
              <p className="text-on-surface-variant text-sm sm:text-base mt-1.5 max-w-xl leading-relaxed">
                {activeGame?.shortDescription}
              </p>
            </div>
          </div>

          {/* Quick specs pill row */}
          <div className="flex items-center gap-3 flex-wrap mb-8">
            <div className="bg-surface-container px-3.5 py-1.5 rounded-full border border-outline-variant text-xs font-medium text-on-surface flex items-center gap-1.5">
              <MaterialSymbols icon="help_outline" size={16} className="text-primary" />
              <span>{activeGame?.questionCount} Questions</span>
            </div>
            <div className="bg-surface-container px-3.5 py-1.5 rounded-full border border-outline-variant text-xs font-medium text-on-surface flex items-center gap-1.5">
              <MaterialSymbols icon="timer" size={16} className="text-primary" />
              <span>{Math.round((activeGame?.timeLimitSeconds || 120) / 60)} Minutes</span>
            </div>
            <div className="bg-surface-container px-3.5 py-1.5 rounded-full border border-outline-variant text-xs font-medium text-on-surface flex items-center gap-1.5">
              <MaterialSymbols icon="military_tech" size={16} className="text-primary" />
              <span>{activeGame?.difficulty} Level</span>
            </div>
          </div>

          {/* Action Zone: Replay Blocked vs PLAY NOW FAB */}
          {attemptCheck?.canPlay === false ? (
            <div className="bg-[#FEF0CD] border border-[#FDD663] text-[#493300] dark:bg-[#5C3800]/50 dark:border-[#B06000] dark:text-[#FFE082] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MaterialSymbols icon="lock" size={24} className="text-[#B06000] shrink-0" fill />
                <div>
                  <div className="font-bold text-sm">Attempt Completed</div>
                  <div className="text-xs opacity-90">
                    You have already submitted an attempt for {activeGame?.name}. Replay is strictly prohibited.
                  </div>
                </div>
              </div>

              {attemptCheck.attempt && (
                <button
                  type="button"
                  onClick={() => setViewingResultAttempt(attemptCheck.attempt!)}
                  className="px-5 py-2 rounded-full bg-surface text-on-surface text-xs font-semibold shadow-xs hover:bg-surface-container shrink-0"
                >
                  View My Score ({attemptCheck.attempt.score}/{attemptCheck.attempt.totalQuestions})
                </button>
              )}
            </div>
          ) : (
            <div>
              <button
                type="button"
                disabled={isStarting}
                onClick={handlePlayNow}
                className="w-full sm:w-auto px-10 py-4 rounded-full m3-btn-primary font-bold text-lg inline-flex items-center justify-center gap-3 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                {isStarting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting Session...</span>
                  </>
                ) : (
                  <>
                    <MaterialSymbols icon="play_arrow" size={26} fill />
                    <span>PLAY NOW</span>
                  </>
                )}
              </button>
              <p className="text-xs text-on-surface-variant mt-2.5">
                Note: Each student has exactly 1 attempt per game. Make sure your connection is stable before starting.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overview of all 6 Orientation Games */}
      <section aria-labelledby="challenges-heading" className="mt-12">
        <h3 id="challenges-heading" className="font-display font-semibold text-lg text-on-surface mb-4">
          All Orientation Challenges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.values(GAME_DEFINITIONS).map((def) => {
            const isThisActive = def.id === activeGameId && isGameActive;
            return (
              <div
                key={def.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isThisActive
                    ? 'bg-primary-container/40 border-primary shadow-xs'
                    : 'bg-surface border-outline-variant'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                    <MaterialSymbols icon={def.icon} size={18} fill />
                  </div>
                  {isThisActive ? (
                    <StatusChip status="ACTIVE" size="sm" />
                  ) : (
                    <StatusChip status="INACTIVE" size="sm" />
                  )}
                </div>
                <h4 className="font-bold text-sm text-on-surface">{def.name}</h4>
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                  {def.shortDescription}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};
