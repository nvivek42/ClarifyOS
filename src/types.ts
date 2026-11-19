export type QuadrantId = 'do' | 'schedule' | 'delegate' | 'eliminate';

export type LongTermGoalStatus = 'draft' | 'locked' | 'achieved';

export type ReassessmentStatus = 'persevere' | 'pivot' | 'scale' | 'drop';

export type ActiveTab = 'matrix' | 'long-term' | 'experiments';

export interface TaskItem {
  id: string;
  title: string;
  notes: string;
  quadrant: QuadrantId;
  completed: boolean;
  goalId: string | null;
  createdAt: number;
  isSample?: boolean;
}

export interface LongTermGoal {
  id: string;
  title: string;
  status: LongTermGoalStatus;
  what: string;
  why: string;
  when: string;
  how: string;
  where: string;
  who: string;
  createdAt: number;
  updatedAt: number;
  isSample?: boolean;
}

export interface FeedbackEntry {
  id: string;
  timestamp: string;
  note: string;
}

export interface ShortTermExperiment {
  id: string;
  title: string;
  timeframe: string;
  hypothesis: string;
  actionSteps: string;
  feedbackLog: FeedbackEntry[];
  reassessment: ReassessmentStatus;
  nextIteration: string;
  createdAt: number;
  updatedAt: number;
  isSample?: boolean;
}

export interface AppState {
  version: number;
  tasks: TaskItem[];
  longTermGoals: LongTermGoal[];
  shortTermExperiments: ShortTermExperiment[];
}
