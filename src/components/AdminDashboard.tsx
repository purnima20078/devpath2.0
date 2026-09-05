import React, { useState, useEffect } from 'react';
import {
  AdminUsername,
  GameAttempt,
  GameId,
  GameSession,
  RegisteredStudent,
  SeminarHallState,
  UserSession,
} from '../types';
import { GAME_DEFINITIONS } from '../data/gamesData';
import {
  deleteGameSession,
  deleteStudentUser,
  startHallGame,
  stopHallGame,
  subscribeToHallGameResults,
  subscribeToHallSessions,
  subscribeToHallStudents,
} from '../services/gameService';
import { generateHallGamePdf } from '../services/pdfService';
import { MaterialSymbols } from './MaterialSymbols';
import { StatusChip } from './StatusChip';
import { MaterialDialog } from './MaterialDialog';

interface AdminDashboardProps {
  session: UserSession;
  hallState: SeminarHallState | null;
  onShowSnackbar: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

type AdminTab = 'GAMES' | 'RESULTS' | 'STUDENTS' | 'HISTORY';
type SortMode = 'LEADERBOARD' | 'COMPLETION_ORDER';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  hallState,
  onShowSnackbar,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('GAMES');
  const [selectedGameId, setSelectedGameId] = useState<GameId>(
    hallState?.activeGameId || 'LOGO'
  );
  const [sortMode, setSortMode] = useState<SortMode>('LEADERBOARD');

  // Real-time data
  const [gameResults, setGameResults] = useState<GameAttempt[]>([]);
  const [hallSessions, setHallSessions] = useState<GameSession[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);

  // Dialog & Deletion controls
  const [stopConfirmGame, setStopConfirmGame] = useState<GameId | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<GameSession | null>(null);
  const [manualAdmissionInput, setManualAdmissionInput] = useState('');
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update selected game if hall active game changes
  useEffect(() => {
    if (hallState?.activeGameId) {
      setSelectedGameId(hallState.activeGameId);
    }
  }, [hallState?.activeGameId]);

  // Subscribe to live results for selected game in this hall
  useEffect(() => {
    const unsubscribe = subscribeToHallGameResults(
      session.hallId,
      selectedGameId,
      (results) => {
        setGameResults(results);
      }
    );
    return () => unsubscribe();
  }, [session.hallId, selectedGameId]);

  // Subscribe to sessions history for this hall
  useEffect(() => {
    const unsubscribe = subscribeToHallSessions(session.hallId, (sessions) => {
      setHallSessions(sessions);
    });
    return () => unsubscribe();
  }, [session.hallId]);

  // Subscribe to registered students in this hall
  useEffect(() => {
    const unsubscribe = subscribeToHallStudents(session.hallId, (students) => {
      setRegisteredStudents(students);
    });
    return () => unsubscribe();
  }, [session.hallId]);

  // Handler: Delete student so student can newly login
  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeletingStudent(true);
    const res = await deleteStudentUser(session.hallId, studentToDelete);
    setIsDeletingStudent(false);

    if (res.success) {
      onShowSnackbar(
        `User ${studentToDelete} deleted successfully. All attempts cleared. They can now newly log in.`,
        'success'
      );
      setStudentToDelete(null);
      if (manualAdmissionInput.trim().toUpperCase() === studentToDelete.trim().toUpperCase()) {
        setManualAdmissionInput('');
      }
    } else {
      onShowSnackbar(res.error || 'Failed to delete user.', 'error');
    }
  };

  // Handler: Delete session record from history
  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeletingSession(true);
    const res = await deleteGameSession(sessionToDelete.sessionId);
    setIsDeletingSession(false);

    if (res.success) {
      onShowSnackbar('Session record deleted successfully from history.', 'success');
      setSessionToDelete(null);
    } else {
      onShowSnackbar(res.error || 'Failed to delete session record.', 'error');
    }
  };

  // Handler: Start Game
  const handleStartGame = async (gameId: GameId) => {
    if (hallState?.activeGameStatus === 'ACTIVE' && hallState.activeGameId) {
      onShowSnackbar(
        'Another game is currently active in this seminar hall. Stop the current game before starting a new one.',
        'error'
      );
      return;
    }

    setIsProcessing(true);
    const res = await startHallGame(
      session.hallId,
      session.username as AdminUsername,
      gameId
    );
    setIsProcessing(false);

    if (res.success) {
      setSelectedGameId(gameId);
      onShowSnackbar(`Game "${GAME_DEFINITIONS[gameId].name}" started successfully!`, 'success');
    } else {
      onShowSnackbar(res.error || 'Failed to start game.', 'error');
    }
  };

  // Handler: Stop Game
  const handleConfirmStop = async () => {
    if (!stopConfirmGame) return;
    setIsProcessing(true);

    const res = await stopHallGame(
      session.hallId,
      session.username as AdminUsername
    );
    setIsProcessing(false);
    setStopConfirmGame(null);

    if (res.success) {
      onShowSnackbar('Game has been stopped for this seminar hall.', 'info');
    } else {
      onShowSnackbar(res.error || 'Failed to stop game.', 'error');
    }
  };

  // Handler: PDF Download
  const handleDownloadPdf = (targetGameId: GameId) => {
    if (targetGameId === selectedGameId) {
      generateHallGamePdf({
        hallId: session.hallId,
        adminUsername: session.username,
        gameId: targetGameId,
        attempts: gameResults,
      });
      onShowSnackbar(`Report for ${GAME_DEFINITIONS[targetGameId].name} downloaded.`, 'success');
    } else {
      // Temporarily switch and download
      setSelectedGameId(targetGameId);
      setTimeout(() => {
        generateHallGamePdf({
          hallId: session.hallId,
          adminUsername: session.username,
          gameId: targetGameId,
          attempts: gameResults,
        });
        onShowSnackbar(`Report for ${GAME_DEFINITIONS[targetGameId].name} downloaded.`, 'success');
      }, 500);
    }
  };

  // Sorted Results
  const sortedResults = React.useMemo(() => {
    const list = [...gameResults];
    if (sortMode === 'COMPLETION_ORDER') {
      // Sort by completedAt ASC
      return list.sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return aTime - bTime;
      });
    } else {
      // Leaderboard: Score DESC -> TimeTaken ASC -> CompletedAt ASC
      return list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.timeTaken !== b.timeTaken) return a.timeTaken - b.timeTaken;
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return aTime - bTime;
      });
    }
  }, [gameResults, sortMode]);

  const activeGame = hallState?.activeGameId ? GAME_DEFINITIONS[hallState.activeGameId] : null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Hero Header */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-outline-variant shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-1">
              <MaterialSymbols icon="shield" size={16} fill />
              <span>Hall Control Center</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-on-surface">
              {session.hallName} Administration
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Live session operations, multi-hall isolation & real-time analytics
            </p>
          </div>

          <div className="flex items-center gap-4 bg-surface-container p-4 rounded-2xl border border-outline-variant shrink-0">
            <div>
              <div className="text-xs text-on-surface-variant">Live Hall Status</div>
              <div className="font-bold text-base text-on-surface mt-0.5">
                {activeGame ? activeGame.name : 'No Active Game'}
              </div>
            </div>
            <StatusChip
              status={hallState?.activeGameStatus || 'INACTIVE'}
              label={hallState?.activeGameStatus === 'ACTIVE' ? 'ACTIVE' : 'IDLE'}
            />
          </div>
        </div>

        {/* Google Segmented Navigation Pills */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-outline-variant overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('GAMES')}
            className={`px-5 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'GAMES'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <MaterialSymbols icon="sports_esports" size={18} fill={activeTab === 'GAMES'} />
            <span>Games Control</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESULTS')}
            className={`px-5 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'RESULTS'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <MaterialSymbols icon="leaderboard" size={18} fill={activeTab === 'RESULTS'} />
            <span>Live Results & Leaderboard</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-surface text-on-surface font-mono-digits font-bold">
              {gameResults.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-5 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'STUDENTS'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <MaterialSymbols icon="group" size={18} fill={activeTab === 'STUDENTS'} />
            <span>Students & Re-login</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-surface text-on-surface font-mono-digits font-bold">
              {registeredStudents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-5 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'HISTORY'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <MaterialSymbols icon="history" size={18} fill={activeTab === 'HISTORY'} />
            <span>Session History</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-surface text-on-surface font-mono-digits font-bold">
              {hallSessions.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: 6 Game Cards */}
      {activeTab === 'GAMES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {Object.values(GAME_DEFINITIONS).map((game) => {
            const isThisGameActive =
              hallState?.activeGameId === game.id && hallState.activeGameStatus === 'ACTIVE';
            const isOtherGameActive =
              hallState?.activeGameStatus === 'ACTIVE' && hallState.activeGameId !== game.id;

            return (
              <div
                key={game.id}
                className={`bg-surface rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  isThisGameActive
                    ? 'border-2 border-primary shadow-md'
                    : 'border-outline-variant shadow-xs hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold shadow-xs">
                      <MaterialSymbols icon={game.icon} size={26} fill />
                    </div>
                    <StatusChip
                      status={isThisGameActive ? 'ACTIVE' : 'INACTIVE'}
                      label={isThisGameActive ? 'ACTIVE' : 'INACTIVE'}
                      size="sm"
                    />
                  </div>

                  <h3 className="font-display font-bold text-xl text-on-surface">
                    {game.name}
                  </h3>
                  <p className="text-on-surface-variant text-sm mt-1.5 line-clamp-2 leading-relaxed">
                    {game.shortDescription}
                  </p>

                  <div className="flex items-center gap-3 mt-4 text-xs text-on-surface-variant">
                    <span className="bg-surface-container px-2.5 py-1 rounded-full font-medium">
                      {game.questionCount} Questions
                    </span>
                    <span className="bg-surface-container px-2.5 py-1 rounded-full font-medium">
                      {Math.round(game.timeLimitSeconds / 60)} Mins
                    </span>
                    <span className="bg-surface-container px-2.5 py-1 rounded-full font-medium">
                      {game.difficulty}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-outline-variant flex flex-col gap-2.5">
                  {isThisGameActive ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setStopConfirmGame(game.id)}
                      className="w-full py-2.5 rounded-full bg-[#D93025] text-white hover:bg-[#B3261E] active:bg-[#8C1D18] font-medium text-sm inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <MaterialSymbols icon="stop" size={20} fill />
                      <span>Stop Game</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleStartGame(game.id)}
                      className={`w-full py-2.5 rounded-full m3-btn-primary font-medium text-sm inline-flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.99] ${
                        isOtherGameActive ? 'opacity-50' : ''
                      }`}
                    >
                      <MaterialSymbols icon="play_arrow" size={20} fill />
                      <span>Start Game</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGameId(game.id);
                        setActiveTab('RESULTS');
                      }}
                      className="flex-1 py-2 rounded-full border border-outline text-xs font-medium text-on-surface hover:bg-surface-container transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <MaterialSymbols icon="visibility" size={16} />
                      <span>Results</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(game.id)}
                      className="p-2 rounded-full border border-outline text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                      title={`Download PDF for ${game.name}`}
                      aria-label={`Download PDF report for ${game.name}`}
                    >
                      <MaterialSymbols icon="download" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Live Results & Leaderboard */}
      {activeTab === 'RESULTS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="bg-surface rounded-3xl p-5 border border-outline-variant shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Game Selector Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1 shrink-0">
                Game:
              </span>
              {Object.values(GAME_DEFINITIONS).map((def) => {
                const isSelected = selectedGameId === def.id;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => setSelectedGameId(def.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                      isSelected
                        ? 'bg-primary text-on-primary font-semibold shadow-xs'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {def.name}
                  </button>
                );
              })}
            </div>

            {/* Sorting & PDF Trigger */}
            <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
              <div className="bg-surface-container p-1 rounded-full border border-outline-variant flex items-center">
                <button
                  type="button"
                  onClick={() => setSortMode('LEADERBOARD')}
                  className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
                    sortMode === 'LEADERBOARD'
                      ? 'bg-surface text-on-surface font-bold shadow-xs'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Leaderboard
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('COMPLETION_ORDER')}
                  className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
                    sortMode === 'COMPLETION_ORDER'
                      ? 'bg-surface text-on-surface font-bold shadow-xs'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Completion Order
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedGameId)}
                className="px-4 py-2 rounded-full m3-btn-outlined text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <MaterialSymbols icon="picture_as_pdf" size={16} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-2xl border border-outline-variant">
              <div className="text-xs text-on-surface-variant">Total Submissions</div>
              <div className="font-display text-2xl font-bold text-on-surface mt-1">
                {gameResults.length}
              </div>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-outline-variant">
              <div className="text-xs text-on-surface-variant">Completed</div>
              <div className="font-display text-2xl font-bold text-[#188038] dark:text-[#6DD58C] mt-1">
                {gameResults.filter((r) => r.status === 'completed').length}
              </div>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-outline-variant">
              <div className="text-xs text-on-surface-variant">Top Score</div>
              <div className="font-display text-2xl font-bold text-primary mt-1">
                {gameResults.length > 0 ? Math.max(...gameResults.map((r) => r.score)) : 0}
                <span className="text-xs font-normal opacity-70">
                  /{GAME_DEFINITIONS[selectedGameId].questionCount}
                </span>
              </div>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-outline-variant">
              <div className="text-xs text-on-surface-variant">Hall Isolation</div>
              <div className="text-xs font-bold text-on-surface mt-2 truncate">
                {session.hallName}
              </div>
            </div>
          </div>

          {/* Google Material Data Table */}
          <div className="bg-surface rounded-3xl border border-outline-variant shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                    <th className="py-4 px-6">Rank</th>
                    <th className="py-4 px-6">Admission Number</th>
                    <th className="py-4 px-6">Score</th>
                    <th className="py-4 px-6">Time Taken</th>
                    <th className="py-4 px-6">Completed At</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {sortedResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <MaterialSymbols icon="inbox" size={32} />
                          <span>No submissions yet for {GAME_DEFINITIONS[selectedGameId].name}</span>
                          <span className="text-xs opacity-70">
                            Results will appear automatically as students submit their answers.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedResults.map((att, idx) => {
                      const isCompleted = att.status === 'completed';
                      const isTop3 = isCompleted && idx < 3 && sortMode === 'LEADERBOARD';

                      return (
                        <tr
                          key={`${att.attemptId || att.admissionNumber}_${idx}`}
                          className="hover:bg-surface-container transition-colors duration-150"
                        >
                          <td className="py-3.5 px-6 font-bold">
                            <div className="flex items-center gap-2">
                              {isTop3 && (
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    idx === 0
                                      ? 'bg-[#FBBC04]'
                                      : idx === 1
                                      ? 'bg-[#9AA0A6]'
                                      : 'bg-[#B06000]'
                                  }`}
                                />
                              )}
                              <span>{isCompleted ? idx + 1 : '-'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 font-mono-digits font-bold text-on-surface">
                            {att.admissionNumber}
                          </td>
                          <td className="py-3.5 px-6 font-display font-semibold">
                            <span className="text-primary font-bold">{att.score}</span>
                            <span className="text-on-surface-variant text-xs">
                              /{att.totalQuestions}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 font-mono-digits text-on-surface-variant">
                            {formatTime(att.timeTaken)}
                          </td>
                          <td className="py-3.5 px-6 text-on-surface-variant text-xs">
                            {att.completedAt
                              ? new Date(att.completedAt).toLocaleTimeString()
                              : 'Incomplete'}
                          </td>
                          <td className="py-3.5 px-6">
                            <StatusChip
                              status={
                                att.status === 'completed'
                                  ? 'COMPLETED'
                                  : att.status === 'stopped_by_admin'
                                  ? 'STOPPED'
                                  : 'IN_PROGRESS'
                              }
                              size="sm"
                              label={
                                att.status === 'completed'
                                  ? 'Completed'
                                  : att.status === 'stopped_by_admin'
                                  ? 'Stopped'
                                  : 'In Progress'
                              }
                            />
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => setStudentToDelete(att.admissionNumber)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#B3261E] dark:text-[#F2B8B5] hover:bg-[#B3261E]/10 transition-colors inline-flex items-center gap-1.5"
                              title="Delete user so they can newly login"
                            >
                              <MaterialSymbols icon="person_remove" size={16} />
                              <span>Delete / Reset</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Students Management & Re-login Controls */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Quick Action Card */}
          <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-outline-variant shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-display font-bold text-xl text-on-surface flex items-center gap-2">
                  <MaterialSymbols icon="manage_accounts" size={24} className="text-primary" />
                  <span>Student Accounts & Re-login Management</span>
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  Admins can delete any registered student account to clear previous attempts, enabling them to newly log in and start fresh.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container">
                  {registeredStudents.length} Students in {session.hallName}
                </span>
              </div>
            </div>

            {/* Quick Delete Input Form */}
            <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl border border-outline-variant">
              <label
                htmlFor="quick-delete-input"
                className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2"
              >
                Quick Delete & Reset by Admission Number
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="quick-delete-input"
                  type="text"
                  value={manualAdmissionInput}
                  onChange={(e) => setManualAdmissionInput(e.target.value)}
                  placeholder="e.g. 001/AIM/2026, 002/CAI/2026, 003/CSD/2026"
                  className="flex-1 px-4 py-2.5 rounded-full bg-surface border border-outline font-mono-digits text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary"
                />
                <button
                  type="button"
                  disabled={!manualAdmissionInput.trim()}
                  onClick={() => setStudentToDelete(manualAdmissionInput.trim().toUpperCase())}
                  className="px-5 py-2.5 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2 bg-[#B3261E] text-white hover:bg-[#8C1D18] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
                >
                  <MaterialSymbols icon="person_remove" size={18} />
                  <span>Delete & Allow Re-login</span>
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
                <MaterialSymbols icon="info" size={16} className="shrink-0 text-primary" />
                <span>Entering an admission number here will delete their hall registration and all past game attempts.</span>
              </p>
            </div>
          </div>

          {/* Registered Students Table */}
          <div className="bg-surface rounded-3xl border border-outline-variant shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-display font-bold text-base text-on-surface">
                Registered Students in {session.hallName}
              </h4>
              <span className="text-xs text-on-surface-variant">
                Total: {registeredStudents.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                    <th className="py-4 px-6">#</th>
                    <th className="py-4 px-6">Admission Number</th>
                    <th className="py-4 px-6">First Registered</th>
                    <th className="py-4 px-6">Last Login</th>
                    <th className="py-4 px-6">Hall</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {registeredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <MaterialSymbols icon="group_off" size={32} />
                          <span>No students registered in this hall yet</span>
                          <span className="text-xs opacity-70">
                            Students will appear here as soon as they log into {session.hallName}.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    registeredStudents.map((st, idx) => (
                      <tr
                        key={`${st.id || st.admissionNumber}_${idx}`}
                        className="hover:bg-surface-container transition-colors duration-150"
                      >
                        <td className="py-3.5 px-6 font-mono-digits text-xs text-on-surface-variant">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-6 font-mono-digits font-bold text-on-surface">
                          {st.admissionNumber}
                        </td>
                        <td className="py-3.5 px-6 text-xs text-on-surface-variant">
                          {new Date(st.registeredAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-6 text-xs text-on-surface-variant">
                          {new Date(st.lastLoginAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-6 text-xs font-semibold text-primary">
                          {st.hallName}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(st.admissionNumber)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#B3261E] dark:text-[#F2B8B5] hover:bg-[#B3261E]/10 transition-colors inline-flex items-center gap-1.5"
                            title="Delete user so they can newly login"
                          >
                            <MaterialSymbols icon="person_remove" size={16} />
                            <span>Delete User</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Session History */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold text-lg text-on-surface">
              Past Game Sessions in {session.hallName}
            </h3>
            <span className="text-xs text-on-surface-variant">
              Showing sessions for {session.hallName} only
            </span>
          </div>

          {hallSessions.length === 0 ? (
            <div className="bg-surface rounded-3xl p-12 border border-outline-variant text-center text-on-surface-variant">
              <MaterialSymbols icon="history_edu" size={36} className="mx-auto mb-2 opacity-60" />
              <p>No past sessions recorded yet for this hall.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {hallSessions.map((s, idx) => {
                const game = GAME_DEFINITIONS[s.gameId];
                return (
                  <div
                    key={`${s.sessionId}_${idx}`}
                    className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                        <MaterialSymbols icon={game?.icon || 'sports_esports'} size={24} fill />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-on-surface">
                            {game?.name || s.gameId}
                          </h4>
                          <StatusChip
                            status={s.status === 'active' ? 'ACTIVE' : 'COMPLETED'}
                            label={s.status.toUpperCase()}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1 flex-wrap">
                          <span>Date: {new Date(s.startedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Started: {new Date(s.startedAt).toLocaleTimeString()}</span>
                          {s.stoppedAt && (
                            <>
                              <span>•</span>
                              <span>Stopped: {new Date(s.stoppedAt).toLocaleTimeString()}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-medium">
                            Completions: {s.completedParticipants}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(s.gameId)}
                        className="px-4 py-2 rounded-full border border-outline text-xs font-semibold text-primary hover:bg-surface-container shrink-0 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <MaterialSymbols icon="download" size={16} />
                        <span>Download PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSessionToDelete(s)}
                        className="px-3.5 py-2 rounded-full border border-[#B3261E]/30 text-xs font-semibold text-[#B3261E] dark:text-[#F2B8B5] hover:bg-[#B3261E]/10 transition-colors shrink-0 inline-flex items-center gap-1.5"
                        title="Delete session record from history"
                      >
                        <MaterialSymbols icon="delete" size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stop Game Confirmation Material Dialog */}
      <MaterialDialog
        isOpen={Boolean(stopConfirmGame)}
        title="Stop Active Game?"
        message={`Are you sure you want to stop "${
          stopConfirmGame ? GAME_DEFINITIONS[stopConfirmGame].name : ''
        }" for ${session.hallName}? Students currently playing will be unable to finish.`}
        confirmLabel="Stop Game"
        cancelLabel="Cancel"
        isDestructive={true}
        icon="warning"
        isLoading={isProcessing}
        onConfirm={handleConfirmStop}
        onCancel={() => setStopConfirmGame(null)}
      />

      {/* Delete User Confirmation Material Dialog */}
      <MaterialDialog
        isOpen={Boolean(studentToDelete)}
        title={`Delete User "${studentToDelete}"?`}
        message={`Deleting this user will clear their registration and all past game attempts in ${session.hallName}. The student will be able to newly log in and participate fresh.`}
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        isDestructive={true}
        icon="person_remove"
        isLoading={isDeletingStudent}
        onConfirm={handleConfirmDeleteStudent}
        onCancel={() => setStudentToDelete(null)}
      />

      {/* Delete Session Confirmation Material Dialog */}
      <MaterialDialog
        isOpen={Boolean(sessionToDelete)}
        title="Delete Session Record?"
        message={`Are you sure you want to delete the session record for "${
          sessionToDelete ? (GAME_DEFINITIONS[sessionToDelete.gameId]?.name || sessionToDelete.gameId) : ''
        }" (${sessionToDelete ? new Date(sessionToDelete.startedAt).toLocaleString() : ''}) from history? This action cannot be undone.`}
        confirmLabel="Delete Session"
        cancelLabel="Cancel"
        isDestructive={true}
        icon="delete"
        isLoading={isDeletingSession}
        onConfirm={handleConfirmDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
};
