import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  runTransaction,
  increment,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  AdminUsername,
  AttemptStatus,
  GameAttempt,
  GameId,
  GameSession,
  RegisteredStudent,
  SeminarHallId,
  SeminarHallState,
} from '../types';

export const ADMIN_HALL_MAP: Record<AdminUsername, { hallId: SeminarHallId; hallName: string }> = {
  'GDGADMIN@SM1': { hallId: 'HALL_1', hallName: 'Seminar Hall 1' },
  'GDGADMIN@SM2': { hallId: 'HALL_2', hallName: 'Seminar Hall 2' },
  'GDGADMIN@SM3': { hallId: 'HALL_3', hallName: 'Seminar Hall 3' },
};

export const HALL_NAMES: Record<SeminarHallId, string> = {
  HALL_1: 'Seminar Hall 1',
  HALL_2: 'Seminar Hall 2',
  HALL_3: 'Seminar Hall 3',
};

/**
 * Valid student admission format:
 * - 3 digits prefix: [0-9]{3}
 * - Middle branch: AIM, CAI, or CSD
 * - Year suffix: 2026 for every student
 * Example: 001/AIM/2026, 042/CAI/2026, 120/CSD/2026
 */
export const STUDENT_ADMISSION_REGEX = /^[0-9]{3}\/(AIM|CAI|CSD)\/2026$/;

export interface AdmissionValidationResult {
  isValid: boolean;
  normalizedAdmission?: string;
  error?: string;
}

export function validateStudentAdmissionNumber(rawInput: string): AdmissionValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Admission number is required.' };
  }

  const upper = trimmed.toUpperCase();
  const parts = upper.split('/');

  if (parts.length !== 3) {
    return {
      isValid: false,
      error: 'Invalid format. Use 3 parts separated by slashes: 001/AIM/2026 (or CAI / CSD).',
    };
  }

  const [rollPrefix, department, year] = parts;

  // 1. Roll prefix must be exactly 3 digits
  if (!/^[0-9]{3}$/.test(rollPrefix)) {
    return {
      isValid: false,
      error: `Invalid roll number "${rollPrefix}". First part must be exactly 3 digits (e.g. 001, 042, 120).`,
    };
  }

  // 2. Department must be AIM, CAI, or CSD
  const validDepartments = ['AIM', 'CAI', 'CSD'];
  if (!validDepartments.includes(department)) {
    return {
      isValid: false,
      error: `Invalid department "${department}". Middle part must be either AIM, CAI, or CSD.`,
    };
  }

  // 3. Year must be 2026 for every student
  if (year !== '2026') {
    return {
      isValid: false,
      error: `Invalid year "${year}". Last part must be 2026 for every admission number.`,
    };
  }

  return {
    isValid: true,
    normalizedAdmission: `${rollPrefix}/${department}/2026`,
  };
}

export const makeAttemptId = (hallId: SeminarHallId, admissionNumber: string, gameId: GameId): string => {
  const cleanAdmission = admissionNumber.trim().replace(/\//g, '_');
  return `${hallId}__${cleanAdmission}__${gameId}`;
};

let hallsInitialized = false;

/**
 * Initializes default seminar halls in Firestore if not already seeded.
 */
export async function initializeHallsIfMissing(): Promise<void> {
  if (hallsInitialized) return;
  hallsInitialized = true;

  const hallConfigs: Array<{ id: SeminarHallId; name: string; admin: AdminUsername }> = [
    { id: 'HALL_1', name: 'Seminar Hall 1', admin: 'GDGADMIN@SM1' },
    { id: 'HALL_2', name: 'Seminar Hall 2', admin: 'GDGADMIN@SM2' },
    { id: 'HALL_3', name: 'Seminar Hall 3', admin: 'GDGADMIN@SM3' },
  ];

  await Promise.all(
    hallConfigs.map(async (config) => {
      const hallRef = doc(db, 'seminarHalls', config.id);
      try {
        const snap = await getDoc(hallRef);
        if (!snap.exists()) {
          const initialData: SeminarHallState = {
            hallId: config.id,
            hallName: config.name,
            adminUsername: config.admin,
            activeGameId: null,
            activeGameStatus: 'INACTIVE',
            activeGameStartedAt: null,
            currentSessionId: null,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(hallRef, initialData);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `seminarHalls/${config.id}`);
      }
    })
  );
}

/**
 * Real-time listener for a seminar hall state.
 */
export function subscribeToHall(
  hallId: SeminarHallId,
  callback: (hall: SeminarHallState | null) => void
): () => void {
  const hallRef = doc(db, 'seminarHalls', hallId);
  return onSnapshot(
    hallRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as SeminarHallState);
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `seminarHalls/${hallId}`);
    }
  );
}

/**
 * Admin action: Start a game in their assigned hall.
 */
export async function startHallGame(
  hallId: SeminarHallId,
  adminUsername: AdminUsername,
  gameId: GameId
): Promise<{ success: boolean; error?: string }> {
  // 1. Strict admin authorization check
  const mapped = ADMIN_HALL_MAP[adminUsername];
  if (!mapped || mapped.hallId !== hallId) {
    return { success: false, error: 'Unauthorized: Admin does not have permission for this seminar hall.' };
  }

  const hallRef = doc(db, 'seminarHalls', hallId);

  try {
    return await runTransaction(db, async (transaction) => {
      const hallSnap = await transaction.get(hallRef);
      if (!hallSnap.exists()) {
        throw new Error('Seminar hall document not found.');
      }

      const hallData = hallSnap.data() as SeminarHallState;

      // 2. Only one active game per hall restriction
      if (hallData.activeGameStatus === 'ACTIVE' && hallData.activeGameId) {
        throw new Error('Another game is currently active in this seminar hall. Stop the current game before starting a new one.');
      }

      const nowIso = new Date().toISOString();
      const sessionId = `${hallId}_${gameId}_${Date.now()}`;
      const sessionRef = doc(db, 'gameSessions', sessionId);

      const sessionData: GameSession = {
        sessionId,
        gameId,
        seminarHallId: hallId,
        startedAt: nowIso,
        stoppedAt: null,
        status: 'active',
        totalParticipants: 0,
        completedParticipants: 0,
      };

      transaction.set(sessionRef, sessionData);

      transaction.update(hallRef, {
        activeGameId: gameId,
        activeGameStatus: 'ACTIVE',
        activeGameStartedAt: nowIso,
        currentSessionId: sessionId,
        updatedAt: nowIso,
      });

      return { success: true };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start game';
    return { success: false, error: message };
  }
}

/**
 * Admin action: Stop the currently active game in their assigned hall.
 */
export async function stopHallGame(
  hallId: SeminarHallId,
  adminUsername: AdminUsername
): Promise<{ success: boolean; error?: string }> {
  const mapped = ADMIN_HALL_MAP[adminUsername];
  if (!mapped || mapped.hallId !== hallId) {
    return { success: false, error: 'Unauthorized: Admin does not have permission for this seminar hall.' };
  }

  const hallRef = doc(db, 'seminarHalls', hallId);

  try {
    return await runTransaction(db, async (transaction) => {
      const hallSnap = await transaction.get(hallRef);
      if (!hallSnap.exists()) {
        throw new Error('Seminar hall not found.');
      }

      const hallData = hallSnap.data() as SeminarHallState;
      const nowIso = new Date().toISOString();

      if (hallData.currentSessionId) {
        const sessionRef = doc(db, 'gameSessions', hallData.currentSessionId);
        transaction.update(sessionRef, {
          stoppedAt: nowIso,
          status: 'stopped',
        });
      }

      transaction.update(hallRef, {
        activeGameStatus: 'STOPPED',
        activeGameId: null,
        updatedAt: nowIso,
      });

      return { success: true };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to stop game';
    return { success: false, error: message };
  }
}

/**
 * Check if a student has an existing attempt for a specific game in a seminar hall.
 * Identifies attempts deterministically by hallId + admissionNumber + gameId.
 */
export async function checkStudentAttempt(
  hallId: SeminarHallId,
  admissionNumber: string,
  gameId: GameId
): Promise<{ canPlay: boolean; reason?: string; attempt?: GameAttempt }> {
  const attemptId = makeAttemptId(hallId, admissionNumber, gameId);
  const attemptRef = doc(db, 'gameAttempts', attemptId);

  try {
    const snap = await getDoc(attemptRef);
    if (!snap.exists()) {
      return { canPlay: true };
    }

    const attempt = snap.data() as GameAttempt;
    if (attempt.status === 'completed') {
      return {
        canPlay: false,
        reason: 'You have already completed this game. Replay is not allowed.',
        attempt,
      };
    }

    if (attempt.status === 'stopped_by_admin') {
      return {
        canPlay: false,
        reason: 'This game session was previously stopped by the administrator. Replay is not allowed.',
        attempt,
      };
    }

    // In progress attempt exists
    return { canPlay: true, attempt };
  } catch (err) {
    console.error('Error checking student attempt:', err);
    return { canPlay: false, reason: 'Unable to verify previous attempts. Check internet connection.' };
  }
}

/**
 * Start or register a student attempt atomically.
 */
export async function startStudentAttempt(
  hallId: SeminarHallId,
  admissionNumber: string,
  gameId: GameId,
  totalQuestions: number,
  sessionId?: string | null
): Promise<{ success: boolean; error?: string; attempt?: GameAttempt }> {
  const attemptId = makeAttemptId(hallId, admissionNumber, gameId);
  const attemptRef = doc(db, 'gameAttempts', attemptId);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(attemptRef);
      const nowIso = new Date().toISOString();

      if (snap.exists()) {
        const existing = snap.data() as GameAttempt;
        if (existing.status === 'completed' || existing.status === 'stopped_by_admin') {
          throw new Error('You have already completed this game. Replay is not allowed.');
        }
        return { success: true, attempt: existing };
      }

      const newAttempt: GameAttempt = {
        attemptId,
        admissionNumber,
        seminarHallId: hallId,
        gameId,
        status: 'in_progress',
        score: 0,
        totalQuestions,
        correctAnswers: 0,
        incorrectAnswers: 0,
        timeTaken: 0,
        startedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      transaction.set(attemptRef, newAttempt);

      if (sessionId) {
        const sessionRef = doc(db, 'gameSessions', sessionId);
        transaction.update(sessionRef, {
          totalParticipants: increment(1),
        });
      }

      return { success: true, attempt: newAttempt };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register attempt';
    return { success: false, error: message };
  }
}

/**
 * Atomically submit student attempt results.
 */
export async function submitStudentAttempt(
  hallId: SeminarHallId,
  admissionNumber: string,
  gameId: GameId,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  incorrectAnswers: number,
  timeTaken: number,
  status: AttemptStatus = 'completed',
  sessionId?: string | null
): Promise<{ success: boolean; error?: string; attempt?: GameAttempt }> {
  const attemptId = makeAttemptId(hallId, admissionNumber, gameId);
  const attemptRef = doc(db, 'gameAttempts', attemptId);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(attemptRef);
      const nowIso = new Date().toISOString();

      if (!snap.exists()) {
        // Create completed attempt directly if missing
        const newAttempt: GameAttempt = {
          attemptId,
          admissionNumber,
          seminarHallId: hallId,
          gameId,
          status,
          score,
          totalQuestions,
          correctAnswers,
          incorrectAnswers,
          timeTaken,
          startedAt: nowIso,
          completedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        transaction.set(attemptRef, newAttempt);

        if (sessionId) {
          const sessionRef = doc(db, 'gameSessions', sessionId);
          transaction.update(sessionRef, {
            totalParticipants: increment(1),
            completedParticipants: increment(1),
          });
        }
        return { success: true, attempt: newAttempt };
      }

      const existing = snap.data() as GameAttempt;
      if (existing.status === 'completed') {
        throw new Error('This attempt has already been submitted and finalized.');
      }

      const updatedAttempt: GameAttempt = {
        ...existing,
        status,
        score,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        timeTaken,
        completedAt: nowIso,
        updatedAt: nowIso,
      };

      transaction.update(attemptRef, {
        status,
        score,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        timeTaken,
        completedAt: nowIso,
        updatedAt: nowIso,
      });

      if (sessionId && status === 'completed') {
        const sessionRef = doc(db, 'gameSessions', sessionId);
        transaction.update(sessionRef, {
          completedParticipants: increment(1),
        });
      }

      return { success: true, attempt: updatedAttempt };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit attempt';
    return { success: false, error: message };
  }
}

/**
 * Real-time listener for live game results belonging to a specific hall and game.
 * Guarantees strict hall isolation.
 */
export function subscribeToHallGameResults(
  hallId: SeminarHallId,
  gameId: GameId,
  callback: (attempts: GameAttempt[]) => void
): () => void {
  const attemptsQuery = query(
    collection(db, 'gameAttempts'),
    where('seminarHallId', '==', hallId),
    where('gameId', '==', gameId)
  );

  return onSnapshot(
    attemptsQuery,
    (snapshot) => {
      const map = new Map<string, GameAttempt>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as GameAttempt;
        const key = data.attemptId || docSnap.id;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, data);
        } else {
          // Keep newest updatedAt/createdAt
          const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          const newTime = new Date(data.updatedAt || data.createdAt || 0).getTime();
          if (newTime >= existingTime) {
            map.set(key, data);
          }
        }
      });
      callback(Array.from(map.values()));
    },
    (err) => {
      console.error(`Error listening to attempts for ${hallId} - ${gameId}:`, err);
    }
  );
}

/**
 * Real-time listener for previous game sessions belonging to a specific hall.
 */
export function subscribeToHallSessions(
  hallId: SeminarHallId,
  callback: (sessions: GameSession[]) => void
): () => void {
  const sessionsQuery = query(
    collection(db, 'gameSessions'),
    where('seminarHallId', '==', hallId)
  );

  return onSnapshot(
    sessionsQuery,
    (snapshot) => {
      const list: GameSession[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as GameSession);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      callback(list);
    },
    (err) => {
      console.error(`Error listening to sessions for ${hallId}:`, err);
    }
  );
}

/**
 * Record student login in hall registry.
 * If student has already chosen a seminar hall before, locks them to that hall (1 chance only).
 */
export interface RegisteredHallCheckResult {
  isRegistered: boolean;
  hallId?: SeminarHallId;
  hallName?: string;
  registeredAt?: string;
}

/**
 * Checks if a student is already registered and locked to a seminar hall.
 */
export async function getStudentRegisteredHall(
  admissionNumber: string
): Promise<RegisteredHallCheckResult> {
  const cleanAdmission = admissionNumber.trim().toUpperCase().replace(/\//g, '_');
  const normalized = admissionNumber.trim().toUpperCase();

  // Check 1: Zero-latency instantaneous local cache
  try {
    const local = localStorage.getItem(`devpath_locked_hall_${cleanAdmission}`);
    if (local && (local === 'HALL_1' || local === 'HALL_2' || local === 'HALL_3')) {
      return {
        isRegistered: true,
        hallId: local as SeminarHallId,
        hallName: HALL_NAMES[local as SeminarHallId],
      };
    }
  } catch {}

  try {
    // Check 2: Primary global student registration document (O(1) direct key lookup)
    const primaryRef = doc(db, 'students', cleanAdmission);
    const primarySnap = await getDoc(primaryRef);
    if (primarySnap.exists()) {
      const data = primarySnap.data();
      if (data.hallId && (data.hallId === 'HALL_1' || data.hallId === 'HALL_2' || data.hallId === 'HALL_3')) {
        const foundHallId = data.hallId as SeminarHallId;
        try {
          localStorage.setItem(`devpath_locked_hall_${cleanAdmission}`, foundHallId);
        } catch {}
        return {
          isRegistered: true,
          hallId: foundHallId,
          hallName: data.hallName || HALL_NAMES[foundHallId],
          registeredAt: data.registeredAt,
        };
      }
    }

    // Check 3: Parallelized fallback search
    const halls: SeminarHallId[] = ['HALL_1', 'HALL_2', 'HALL_3'];
    const [legacyResults, qSnap, attemptSnap] = await Promise.all([
      Promise.all(
        halls.map(async (h) => {
          try {
            const snap = await getDoc(doc(db, 'students', `${h}__${cleanAdmission}`));
            if (snap.exists()) {
              const data = snap.data();
              if (data.hallId && (data.hallId === 'HALL_1' || data.hallId === 'HALL_2' || data.hallId === 'HALL_3')) {
                return data.hallId as SeminarHallId;
              }
            }
          } catch {}
          return null;
        })
      ),
      getDocs(query(collection(db, 'students'), where('admissionNumber', '==', normalized), limit(1))).catch(() => null),
      getDocs(query(collection(db, 'gameAttempts'), where('admissionNumber', '==', normalized), limit(1))).catch(() => null),
    ]);

    // Check legacy results
    const foundLegacy = legacyResults.find((id): id is SeminarHallId => !!id);
    if (foundLegacy) {
      try {
        localStorage.setItem(`devpath_locked_hall_${cleanAdmission}`, foundLegacy);
      } catch {}
      return {
        isRegistered: true,
        hallId: foundLegacy,
        hallName: HALL_NAMES[foundLegacy],
      };
    }

    // Check admission query
    if (qSnap && !qSnap.empty) {
      const first = qSnap.docs[0].data();
      if (first.hallId && (first.hallId === 'HALL_1' || first.hallId === 'HALL_2' || first.hallId === 'HALL_3')) {
        const foundHallId = first.hallId as SeminarHallId;
        try {
          localStorage.setItem(`devpath_locked_hall_${cleanAdmission}`, foundHallId);
        } catch {}
        return {
          isRegistered: true,
          hallId: foundHallId,
          hallName: first.hallName || HALL_NAMES[foundHallId],
          registeredAt: first.registeredAt,
        };
      }
    }

    // Check attempt query
    if (attemptSnap && !attemptSnap.empty) {
      const firstAttempt = attemptSnap.docs[0].data() as GameAttempt;
      const attemptHallId = firstAttempt.seminarHallId;
      if (attemptHallId && (attemptHallId === 'HALL_1' || attemptHallId === 'HALL_2' || attemptHallId === 'HALL_3')) {
        const foundHallId = attemptHallId;
        const foundHallName = HALL_NAMES[foundHallId];

        setDoc(
          primaryRef,
          {
            id: cleanAdmission,
            admissionNumber: normalized,
            hallId: foundHallId,
            hallName: foundHallName,
            registeredAt: firstAttempt.createdAt || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            locked: true,
          },
          { merge: true }
        ).catch(() => {});

        try {
          localStorage.setItem(`devpath_locked_hall_${cleanAdmission}`, foundHallId);
        } catch {}

        return {
          isRegistered: true,
          hallId: foundHallId,
          hallName: foundHallName,
          registeredAt: firstAttempt.createdAt,
        };
      }
    }

    return { isRegistered: false };
  } catch (err) {
    console.warn('Error checking registered hall:', err);
    return { isRegistered: false };
  }
}

/**
 * Record student login in hall registry.
 * Users only have 1 chance to select their seminar hall. If previously registered,
 * this locks them permanently to their initial seminar hall.
 */
export async function registerStudentLogin(
  hallId: SeminarHallId,
  hallName: string,
  admissionNumber: string
): Promise<{ success: boolean; hallId: SeminarHallId; hallName: string; wasAlreadyRegistered: boolean }> {
  try {
    const cleanAdmission = admissionNumber.trim().toUpperCase().replace(/\//g, '_');
    const normalized = admissionNumber.trim().toUpperCase();
    const nowIso = new Date().toISOString();

    // 1. Verify if user is already registered to a hall
    const existing = await getStudentRegisteredHall(normalized);
    if (existing.isRegistered && existing.hallId) {
      const lockedHallId = existing.hallId;
      const lockedHallName = existing.hallName || HALL_NAMES[lockedHallId];

      // Update last login timestamp in background
      const primaryRef = doc(db, 'students', cleanAdmission);
      await setDoc(
        primaryRef,
        {
          id: cleanAdmission,
          admissionNumber: normalized,
          hallId: lockedHallId,
          hallName: lockedHallName,
          lastLoginAt: nowIso,
          locked: true,
        },
        { merge: true }
      ).catch(() => {});

      try {
        localStorage.setItem(`devpath_locked_hall_${cleanAdmission}`, lockedHallId);
      } catch {}

      return {
        success: true,
        hallId: lockedHallId,
        hallName: lockedHallName,
        wasAlreadyRegistered: true,
      };
    }

    // 2. First time registration: permanently bind to selected hall
    const primaryRef = doc(db, 'students', cleanAdmission);
    const hallSpecificRef = doc(db, 'students', `${hallId}__${cleanAdmission}`);

    const studentRecord = {
      id: cleanAdmission,
      admissionNumber: normalized,
      hallId,
      hallName,
      registeredAt: nowIso,
      lastLoginAt: nowIso,
      locked: true,
    };

    await Promise.all([
      setDoc(primaryRef, studentRecord).catch(() => {}),
      setDoc(hallSpecificRef, studentRecord).catch(() => {}),
    ]);

    try {
      localStorage.setItem(`devpath_locked_hall_${cleanAdmission}`, hallId);
    } catch {}

    return {
      success: true,
      hallId,
      hallName,
      wasAlreadyRegistered: false,
    };
  } catch (err) {
    console.warn('Failed to record student login:', err);
    return {
      success: true,
      hallId,
      hallName,
      wasAlreadyRegistered: false,
    };
  }
}

/**
 * Real-time listener for all game attempts of a specific student across their challenges.
 * Powers the Student Dashboard (Score and History).
 */
export function subscribeToStudentAttempts(
  admissionNumber: string,
  callback: (attempts: GameAttempt[]) => void
): () => void {
  const normalized = admissionNumber.trim().toUpperCase();
  const attemptsQuery = query(
    collection(db, 'gameAttempts'),
    where('admissionNumber', '==', normalized)
  );

  return onSnapshot(
    attemptsQuery,
    (snapshot) => {
      const list: GameAttempt[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as GameAttempt);
      });
      // Sort newest completed first
      list.sort((a, b) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.startedAt).getTime();
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.startedAt).getTime();
        return timeB - timeA;
      });
      callback(list);
    },
    (err) => {
      console.error(`Error listening to attempts for ${admissionNumber}:`, err);
    }
  );
}

/**
 * Real-time listener for students in a specific seminar hall.
 */
export function subscribeToHallStudents(
  hallId: SeminarHallId,
  callback: (students: RegisteredStudent[]) => void
): () => void {
  const studentsQuery = query(
    collection(db, 'students'),
    where('hallId', '==', hallId)
  );

  return onSnapshot(
    studentsQuery,
    (snapshot) => {
      const studentMap = new Map<string, RegisteredStudent>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as RegisteredStudent;
        // Key by normalized admission number or clean ID
        const key = (data.admissionNumber || data.id || docSnap.id)
          .trim()
          .toUpperCase()
          .replace(/\//g, '_');

        const existing = studentMap.get(key);
        if (!existing) {
          studentMap.set(key, data);
        } else {
          // Keep the one with the more recent lastLoginAt
          const existingTime = new Date(existing.lastLoginAt || 0).getTime();
          const newTime = new Date(data.lastLoginAt || 0).getTime();
          if (newTime >= existingTime) {
            studentMap.set(key, data);
          }
        }
      });

      const list: RegisteredStudent[] = Array.from(studentMap.values());
      list.sort((a, b) => new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime());
      callback(list);
    },
    (err) => {
      console.error(`Error listening to students for ${hallId}:`, err);
    }
  );
}

/**
 * Admin action: Delete a student and all their game attempts in this hall.
 * This completely resets their record so the student can newly login and choose a hall again.
 */
export async function deleteStudentUser(
  hallId: SeminarHallId,
  admissionNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanAdmission = admissionNumber.trim().toUpperCase().replace(/\//g, '_');
    const normalized = admissionNumber.trim().toUpperCase();

    // 1. Delete student docs across global and hall-specific references
    await Promise.all([
      deleteDoc(doc(db, 'students', cleanAdmission)).catch(() => {}),
      deleteDoc(doc(db, 'students', `${hallId}__${cleanAdmission}`)).catch(() => {}),
      deleteDoc(doc(db, 'students', `HALL_1__${cleanAdmission}`)).catch(() => {}),
      deleteDoc(doc(db, 'students', `HALL_2__${cleanAdmission}`)).catch(() => {}),
      deleteDoc(doc(db, 'students', `HALL_3__${cleanAdmission}`)).catch(() => {}),
    ]);

    // 2. Query any remaining student docs with matching admissionNumber
    const studentsQuery = query(
      collection(db, 'students'),
      where('admissionNumber', '==', normalized)
    );
    const studentsSnap = await getDocs(studentsQuery).catch(() => null);
    if (studentsSnap && !studentsSnap.empty) {
      await Promise.all(studentsSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
    }

    // 3. Query and delete all game attempts matching this admission number across all halls
    const attemptsQuery = query(
      collection(db, 'gameAttempts'),
      where('admissionNumber', '==', normalized)
    );
    const attemptsSnap = await getDocs(attemptsQuery).catch(() => null);
    if (attemptsSnap && !attemptsSnap.empty) {
      const deletePromises = attemptsSnap.docs.map((docSnap) => deleteDoc(docSnap.ref).catch(() => {}));
      await Promise.all(deletePromises);
    }

    // 4. Direct delete known game ID combinations just in case
    const allGames: GameId[] = ['LOGO', 'ABBREVIATION', 'APP', 'EMOJI', 'MATCH', 'RAPID_FIRE'];
    const allHalls: SeminarHallId[] = ['HALL_1', 'HALL_2', 'HALL_3'];
    const directDeletes: Promise<unknown>[] = [];
    for (const h of allHalls) {
      for (const gid of allGames) {
        const id = makeAttemptId(h, normalized, gid);
        directDeletes.push(deleteDoc(doc(db, 'gameAttempts', id)).catch(() => {}));
      }
    }
    await Promise.all(directDeletes);

    // 5. Clear localStorage lock
    try {
      localStorage.removeItem(`devpath_locked_hall_${cleanAdmission}`);
    } catch {}

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete student';
    console.error('Error deleting student user:', err);
    return { success: false, error: message };
  }
}

/**
 * Admin action: Delete a single game session record from history.
 */
export async function deleteGameSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionRef = doc(db, 'gameSessions', sessionId);
    await deleteDoc(sessionRef);
    return { success: true };
  } catch (err) {
    const errInfo = handleFirestoreError(err, OperationType.DELETE, `gameSessions/${sessionId}`);
    return { success: false, error: errInfo.error };
  }
}

