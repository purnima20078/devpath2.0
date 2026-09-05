export type SeminarHallId = 'HALL_1' | 'HALL_2' | 'HALL_3';

export type GameId = 'LOGO' | 'ABBREVIATION' | 'APP' | 'EMOJI' | 'MATCH' | 'RAPID_FIRE';

export type AdminUsername = 'GDGADMIN@SM1' | 'GDGADMIN@SM2' | 'GDGADMIN@SM3';

export interface UserSession {
  role: 'admin' | 'student';
  username: string;
  hallId: SeminarHallId;
  hallName: string;
}

export type HallGameStatus = 'INACTIVE' | 'ACTIVE' | 'STOPPED';

export interface SeminarHallState {
  hallId: SeminarHallId;
  hallName: string;
  adminUsername: AdminUsername;
  activeGameId: GameId | null;
  activeGameStatus: HallGameStatus;
  activeGameStartedAt: string | null;
  currentSessionId: string | null;
  updatedAt: string;
}

export type AttemptStatus = 'in_progress' | 'completed' | 'stopped_by_admin';

export interface GameAttempt {
  attemptId: string; // e.g. HALL_1__001_AIM_2026__LOGO
  admissionNumber: string;
  seminarHallId: SeminarHallId;
  gameId: GameId;
  status: AttemptStatus;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeTaken: number; // in seconds
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameSession {
  sessionId: string;
  gameId: GameId;
  seminarHallId: SeminarHallId;
  startedAt: string;
  stoppedAt: string | null;
  status: 'active' | 'completed' | 'stopped';
  totalParticipants: number;
  completedParticipants: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  clue?: string;
  imageUrl?: string;
  svgIcon?: string;
  emojis?: string;
}

export interface MatchPairItem {
  id: string;
  left: string;
  right: string;
  category?: string;
}

export interface RegisteredStudent {
  id: string; // e.g. HALL_1__001_AIM_2026
  admissionNumber: string;
  hallId: SeminarHallId;
  hallName: string;
  registeredAt: string;
  lastLoginAt: string;
}

export interface GameDefinition {
  id: GameId;
  name: string;
  shortDescription: string;
  questionCount: number;
  timeLimitSeconds: number;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate';
}
