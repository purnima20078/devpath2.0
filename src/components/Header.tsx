import React, { useState, useEffect } from 'react';
import { SeminarHallState, UserSession } from '../types';
import { MaterialSymbols } from './MaterialSymbols';
import { StatusChip } from './StatusChip';
import { GAME_DEFINITIONS } from '../data/gamesData';

interface HeaderProps {
  session: UserSession;
  hallState: SeminarHallState | null;
  onLogout: () => void;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ session, hallState, onLogout, onBack }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      localStorage.getItem('techquest_theme') === 'dark' ||
      (!('techquest_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('techquest_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('techquest_theme', 'light');
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    // Set hall data attribute on root so per-hall CSS custom properties apply
    document.documentElement.setAttribute('data-hall', session.hallId);
  }, [isDarkMode, session.hallId]);

  const activeGame = hallState?.activeGameId ? GAME_DEFINITIONS[hallState.activeGameId] : null;

  // Hall accent styles
  const hallBadgeBg =
    session.hallId === 'HALL_1'
      ? 'bg-[#1A73E8] text-white'
      : session.hallId === 'HALL_2'
      ? 'bg-[#188038] text-white'
      : 'bg-[#B06000] text-white';

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant shadow-xs">
      {!isOnline && (
        <div className="bg-[#D93025] text-white text-xs sm:text-sm font-medium px-4 py-2 text-center flex items-center justify-center gap-2">
          <MaterialSymbols icon="wifi_off" size={18} />
          <span>You are currently offline. Reconnecting...</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Top-Left Back Button + Brand & App Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 -ml-1 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center justify-center shrink-0"
                title="Go Back"
                aria-label="Go Back"
              >
                <MaterialSymbols icon="arrow_back" size={24} />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-outline-variant/80 flex items-center justify-center p-1 shadow-xs shrink-0">
                  <img
                    src="/logo.png"
                    alt="GDG on Campus SVEC"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-on-surface-variant/50 font-light text-sm sm:text-base select-none">×</span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-outline-variant/80 flex items-center justify-center p-1 shadow-xs shrink-0">
                  <img
                    src="/aikyam.png"
                    alt="AIKYAM"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-on-surface">
                    DevPath 2.O
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${hallBadgeBg}`}>
                    {session.hallName}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">
                  GDG on Campus SVEC  •  Orientation 2026
                </p>
              </div>
            </div>
          </div>

          {/* User Session Info & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-surface-container px-3.5 py-1.5 rounded-full border border-outline-variant text-xs sm:text-sm">
              <MaterialSymbols
                icon={session.role === 'admin' ? 'admin_panel_settings' : 'school'}
                size={18}
                className="text-primary"
              />
              <span className="text-on-surface-variant font-normal">
                {session.role === 'admin' ? 'Admin:' : 'Admission No:'}
              </span>
              <span className="font-mono-digits font-semibold text-on-surface">
                {session.username}
              </span>
            </div>

            {/* Quick status for admin */}
            {session.role === 'admin' && (
              <div className="hidden md:flex items-center gap-2">
                <StatusChip
                  status={hallState?.activeGameStatus || 'INACTIVE'}
                  label={activeGame ? `${activeGame.name} (${hallState?.activeGameStatus})` : undefined}
                  size="sm"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <MaterialSymbols icon={isDarkMode ? 'light_mode' : 'dark_mode'} size={20} />
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-[#D93025] hover:bg-[#FCE8E6] dark:hover:bg-[#8C1D18]/30 transition-colors"
                title="Logout"
              >
                <MaterialSymbols icon="logout" size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
