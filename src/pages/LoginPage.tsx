import React, { useState } from 'react';
import { AdminUsername, SeminarHallId, UserSession } from '../types';
import {
  ADMIN_HALL_MAP,
  HALL_NAMES,
  getStudentRegisteredHall,
  registerStudentLogin,
  validateStudentAdmissionNumber,
} from '../services/gameService';
import { MaterialSymbols } from '../components/MaterialSymbols';
import { Footer } from '../components/Footer';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
  onShowSnackbar: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onShowSnackbar }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When a valid student admission number is entered, show seminar hall selection step
  const [isStudentStep, setIsStudentStep] = useState(false);
  const [selectedHall, setSelectedHall] = useState<SeminarHallId | null>(null);
  const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);

  // Track dark mode toggle on login page
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      localStorage.getItem('techquest_theme') === 'dark' ||
      (!('techquest_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsernameInput(val);
    setErrorMessage(null);
    setIsStudentStep(false);
    setSelectedHall(null);
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawVal = usernameInput.trim();

    // 1. Check if exact admin username
    if (rawVal === 'GDGADMIN@SM1' || rawVal === 'GDGADMIN@SM2' || rawVal === 'GDGADMIN@SM3') {
      const adminKey = rawVal as AdminUsername;
      const mapped = ADMIN_HALL_MAP[adminKey];

      onShowSnackbar(`Logged in as Administrator for ${mapped.hallName}`, 'success');
      onLoginSuccess({
        role: 'admin',
        username: adminKey,
        hallId: mapped.hallId,
        hallName: mapped.hallName,
      });
      return;
    }

    // 2. If it resembles lowercase admin username, show exact invalid error
    if (rawVal.toLowerCase().startsWith('gdgadmin')) {
      setErrorMessage('Invalid username. Admin credentials are case-sensitive (e.g. GDGADMIN@SM1).');
      return;
    }

    // 3. Check student admission format:
    // Middle part MUST be either AIM OR CAI OR CSD, and the last part MUST be 2026.
    const validation = validateStudentAdmissionNumber(rawVal);
    if (!validation.isValid || !validation.normalizedAdmission) {
      setErrorMessage(
        validation.error ||
          'Invalid admission number. Format must be 3 digits / (AIM, CAI, or CSD) / 2026.'
      );
      return;
    }

    // 4. Valid student admission number! Normalize input
    const normalizedAdmission = validation.normalizedAdmission;
    setUsernameInput(normalizedAdmission);
    setIsVerifyingStudent(true);

    try {
      // 5. Check if this student is already registered to a seminar hall
      const check = await getStudentRegisteredHall(normalizedAdmission);
      if (check.isRegistered && check.hallId) {
        const lockedHallId = check.hallId;
        const lockedHallName = check.hallName || HALL_NAMES[lockedHallId];

        // Refresh login record
        await registerStudentLogin(lockedHallId, lockedHallName, normalizedAdmission);

        onShowSnackbar(
          `Welcome back! Directing you to your assigned ${lockedHallName}`,
          'success'
        );
        onLoginSuccess({
          role: 'student',
          username: normalizedAdmission,
          hallId: lockedHallId,
          hallName: lockedHallName,
        });
        return;
      }

      // First time login: proceed to hall selection step
      setSelectedHall(null);
      setIsStudentStep(true);
    } catch (err) {
      console.error('Error verifying registered student:', err);
      // Fallback: allow hall selection
      setIsStudentStep(true);
    } finally {
      setIsVerifyingStudent(false);
    }
  };

  const handleCompleteStudentLogin = async () => {
    if (!selectedHall) {
      setErrorMessage('Please select your assigned Seminar Hall to continue.');
      return;
    }

    setIsVerifyingStudent(true);
    setErrorMessage(null);

    try {
      const requestedHallName = HALL_NAMES[selectedHall];
      // registerStudentLogin locks the student to the hall permanently
      const res = await registerStudentLogin(selectedHall, requestedHallName, usernameInput);
      const effectiveHallId = res.hallId;
      const effectiveHallName = res.hallName || HALL_NAMES[effectiveHallId];

      if (res.wasAlreadyRegistered && effectiveHallId !== selectedHall) {
        onShowSnackbar(
          `Notice: You are permanently assigned to ${effectiveHallName}.`,
          'info'
        );
      } else {
        onShowSnackbar(`Permanently assigned to ${effectiveHallName}`, 'success');
      }

      onLoginSuccess({
        role: 'student',
        username: usernameInput,
        hallId: effectiveHallId,
        hallName: effectiveHallName,
      });
    } catch (err) {
      console.error('Error completing student login:', err);
      setErrorMessage('Failed to join seminar hall. Please try again.');
    } finally {
      setIsVerifyingStudent(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container flex flex-col justify-between">
      {/* Top Bar with theme toggle */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-white border border-outline-variant/80 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img
                src="/logo.png"
                alt="GDG on Campus SVEC"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-on-surface-variant/50 font-light text-sm select-none">×</span>
            <div className="w-9 h-9 rounded-lg bg-white border border-outline-variant/80 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img
                src="/aikyam.png"
                alt="AIKYAM"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div>
            <span className="font-display font-bold text-lg text-on-surface tracking-tight">
              DevPath 2.O
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full border border-outline-variant">
              Orientation 2026
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2.5 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Toggle dark mode"
        >
          <MaterialSymbols icon={isDarkMode ? 'light_mode' : 'dark_mode'} size={22} />
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto px-4 py-8">
        <div className="bg-surface rounded-[28px] p-6 sm:p-10 border border-outline-variant shadow-lg transition-all duration-300">
          {/* Header Branding */}
          <div className="text-center mb-8">
            {/* Logos: Both uncompressed, equal in size, and accurate in both light & dark mode */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-outline-variant/80 flex items-center justify-center p-2.5 shadow-xs shrink-0">
                <img
                  src="/logo.png"
                  alt="GDG on Campus SVEC"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-on-surface-variant/50 font-light text-2xl select-none">×</span>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-outline-variant/80 flex items-center justify-center p-2.5 shadow-xs shrink-0">
                <img
                  src="/aikyam.png"
                  alt="AIKYAM"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
              DevPath 2.O
            </h1>
            <p className="text-xs sm:text-sm font-medium text-on-surface-variant mt-1">
              Orientation Program  •  GDG on Campus SVEC × AIKYAM
            </p>
          </div>

          {!isStudentStep ? (
            /* STEP 1: Single input for Admin Username or Student Admission Number */
            <form onSubmit={handleInitialSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="admission-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                >
                  Username / Admission Number
                </label>
                <div className="relative">
                  <input
                    id="admission-input"
                    type="text"
                    autoComplete="off"
                    autoFocus
                    value={usernameInput}
                    onChange={handleInputChange}
                    placeholder="e.g. 001/AIM/2026 or Admin ID"
                    className={`w-full px-4 py-3.5 rounded-2xl bg-surface border font-mono-digits text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden transition-all ${
                      errorMessage
                        ? 'border-[#D93025] ring-2 ring-[#D93025]/20'
                        : 'border-outline focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {usernameInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameInput('');
                        setErrorMessage(null);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                      aria-label="Clear input"
                    >
                      <MaterialSymbols icon="cancel" size={18} />
                    </button>
                  )}
                </div>

                {/* Material Inline Field Error */}
                {errorMessage && (
                  <div
                    className="flex items-center gap-1.5 mt-2.5 text-xs font-medium text-[#D93025] dark:text-[#F2B8B5]"
                    role="alert"
                  >
                    <MaterialSymbols icon="error" size={16} fill className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifyingStudent}
                className="w-full py-3.5 rounded-full m3-btn-primary font-semibold text-base shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isVerifyingStudent ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>CHECKING ASSIGNMENT...</span>
                  </>
                ) : (
                  <>
                    <span>LOGIN</span>
                    <MaterialSymbols icon="arrow_forward" size={20} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Seminar Hall Selection for Verified Student */
            <div className="space-y-6 animate-fade-in">
              <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant block">Verified Student</span>
                  <span className="font-mono-digits font-bold text-sm sm:text-base text-on-surface">
                    {usernameInput}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStudentStep(false)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Permanent Assignment Warning */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-2.5">
                <MaterialSymbols icon="lock" size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-semibold text-on-surface block mb-0.5">One-Time Permanent Assignment</span>
                  Each student can only join <strong>one Seminar Hall</strong> for DevPath 2.O. Once selected, your admission number will be permanently locked to this hall and you will always return here.
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-3">
                  Select Your Seminar Hall
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {/* Hall 1 (Blue Accent) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHall('HALL_1');
                      setErrorMessage(null);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all duration-150 flex items-center justify-between ${
                      selectedHall === 'HALL_1'
                        ? 'border-[#1A73E8] bg-[#D3E3FD]/40 ring-2 ring-[#1A73E8]/30 shadow-xs'
                        : 'border-outline-variant bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface">Seminar Hall 1</div>
                        <div className="text-xs text-on-surface-variant">Blue Accent Room</div>
                      </div>
                    </div>
                    {selectedHall === 'HALL_1' && (
                      <MaterialSymbols icon="check_circle" size={20} className="text-[#1A73E8]" fill />
                    )}
                  </button>

                  {/* Hall 2 (Green Accent) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHall('HALL_2');
                      setErrorMessage(null);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all duration-150 flex items-center justify-between ${
                      selectedHall === 'HALL_2'
                        ? 'border-[#188038] bg-[#CEEAD6]/40 ring-2 ring-[#188038]/30 shadow-xs'
                        : 'border-outline-variant bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#188038] text-white flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface">Seminar Hall 2</div>
                        <div className="text-xs text-on-surface-variant">Green Accent Room</div>
                      </div>
                    </div>
                    {selectedHall === 'HALL_2' && (
                      <MaterialSymbols icon="check_circle" size={20} className="text-[#188038]" fill />
                    )}
                  </button>

                  {/* Hall 3 (Amber Accent) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHall('HALL_3');
                      setErrorMessage(null);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all duration-150 flex items-center justify-between ${
                      selectedHall === 'HALL_3'
                        ? 'border-[#B06000] bg-[#FFE082]/40 ring-2 ring-[#B06000]/30 shadow-xs'
                        : 'border-outline-variant bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#B06000] text-white flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface">Seminar Hall 3</div>
                        <div className="text-xs text-on-surface-variant">Amber Accent Room</div>
                      </div>
                    </div>
                    {selectedHall === 'HALL_3' && (
                      <MaterialSymbols icon="check_circle" size={20} className="text-[#B06000]" fill />
                    )}
                  </button>
                </div>

                {errorMessage && (
                  <div
                    className="flex items-center gap-1.5 mt-3 text-xs font-medium text-[#D93025]"
                    role="alert"
                  >
                    <MaterialSymbols icon="error" size={16} fill />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudentStep(false)}
                  className="flex-1 py-3 rounded-full border border-outline text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedHall || isVerifyingStudent}
                  onClick={handleCompleteStudentLogin}
                  className={`flex-1 py-3 rounded-full m3-btn-primary font-semibold text-sm shadow-xs transition-transform flex items-center justify-center gap-2 ${
                    !selectedHall || isVerifyingStudent ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'
                  }`}
                >
                  {isVerifyingStudent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Locking & Enrolling...</span>
                    </>
                  ) : (
                    <span>Confirm & Enter Hall</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};
