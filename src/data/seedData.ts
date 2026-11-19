import { AppState, LongTermGoal } from '../types';

export const STORAGE_KEY = 'clarityos_data_v1';

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatTimestamp(date = new Date()): string {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function countServingMenAnswered(goal: Pick<LongTermGoal, 'what' | 'why' | 'when' | 'how' | 'where' | 'who'>): number {
  return (['what', 'why', 'when', 'how', 'where', 'who'] as const).filter(
    (key) => goal[key].trim().length > 0
  ).length;
}

export function getSeedData(): AppState {
  const ltId = 'lt_sample_saas';
  const expId = 'exp_sample_deepwork';
  const now = Date.now();

  return {
    version: 1,
    longTermGoals: [
      {
        id: ltId,
        title: 'Launch & Scale Independent B2B Micro-SaaS to $10k MRR',
        status: 'locked',
        what: 'Build, launch, and grow a focused B2B compliance workflow tool to 100 paying customers at $100/mo ($10,000 MRR) with under 3% monthly churn.',
        why: 'Achieve long-term financial autonomy, master product distribution, and solve a painful recurring workflow rather than trading hours for money.',
        when: 'MVP live in 6 weeks; first 10 paying beta users by Month 3; $5k MRR by Month 8; $10k MRR milestone within 14 months.',
        how: 'Validate with 20 customer discovery interviews before writing production code; build a lean single-repo app; acquire customers via technical SEO and direct founder outreach.',
        where: 'English-speaking SMB accounting and legal ops teams (global remote SaaS market), executed from home studio during protected morning deep-work blocks.',
        who: 'Solo founder (product & engineering), 2 industry advisor mentors for bi-weekly reviews, and 5 design-partner customers providing continuous feedback.',
        createdAt: now - 86400000 * 3,
        updatedAt: now - 86400000,
        isSample: true,
      },
    ],
    shortTermExperiments: [
      {
        id: expId,
        title: '14-Day Morning Deep-Work Sprint (Zero Comms Before 10:30 AM)',
        timeframe: '2-Week Sprint',
        hypothesis:
          'If I protect 8:30–10:30 AM exclusively for my highest-leverage product task with Slack and email closed, my weekly shipping velocity will double without working longer hours.',
        actionSteps:
          "1. Leave phone in another room until 10:30 AM.\n2. Write tomorrow's single focus task on an index card at 5:00 PM.\n3. Log daily deep-work completion and afternoon energy.",
        feedbackLog: [
          {
            id: 'log_sample_1',
            timestamp: 'Day 3 — Initial Check-in',
            note: 'Felt mild FOMO during the first 30 minutes, but shipped the core billing webhook two days ahead of estimate.',
          },
          {
            id: 'log_sample_2',
            timestamp: 'Day 7 — Midpoint Review',
            note: 'Zero real emergencies occurred before 10:30 AM. Afternoon decision fatigue dropped noticeably.',
          },
        ],
        reassessment: 'scale',
        nextIteration:
          'Lock this 2-hour block permanently into calendar and add an automated away status during deep work.',
        createdAt: now - 86400000 * 2,
        updatedAt: now - 3600000 * 5,
        isSample: true,
      },
    ],
    tasks: [
      {
        id: 'task_sample_1',
        title: 'Finalize onboarding checklist for 3 beta design partners',
        notes: 'Include data import template and 15-min kickoff call link.',
        quadrant: 'do',
        completed: false,
        goalId: ltId,
        createdAt: now - 3600000 * 4,
        isSample: true,
      },
      {
        id: 'task_sample_2',
        title: 'Book 5 customer discovery interviews on compliance pain points',
        notes: 'Target controllers and ops leads at 10–50 person firms.',
        quadrant: 'schedule',
        completed: false,
        goalId: ltId,
        createdAt: now - 3600000 * 3,
        isSample: true,
      },
      {
        id: 'task_sample_3',
        title: 'Send quarterly bookkeeping receipts to freelance accountant',
        notes: 'Export CSV from business bank account and share folder.',
        quadrant: 'delegate',
        completed: false,
        goalId: null,
        createdAt: now - 3600000 * 2,
        isSample: true,
      },
      {
        id: 'task_sample_4',
        title: 'Unsubscribe from 12 low-signal newsletters & mute noisy channels',
        notes: 'Reduce morning inbox clutter to protect deep-work sprint.',
        quadrant: 'eliminate',
        completed: false,
        goalId: expId,
        createdAt: now - 3600000,
        isSample: true,
      },
    ],
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = getSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      longTermGoals: Array.isArray(parsed.longTermGoals) ? parsed.longTermGoals : [],
      shortTermExperiments: Array.isArray(parsed.shortTermExperiments) ? parsed.shortTermExperiments : [],
    };
  } catch {
    return getSeedData();
  }
}

export function saveAppState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
