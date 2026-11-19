import React, { useEffect, useState } from 'react';
import { ArrowRight, Award, Lock, Mountain, Trash2, Unlock, X } from 'lucide-react';
import { countServingMenAnswered } from '../data/seedData';
import { LongTermGoal, LongTermGoalStatus, QuadrantId } from '../types';

interface LongTermGoalModalProps {
  isOpen: boolean;
  goal: LongTermGoal | null;
  linkedTaskCount: number;
  onClose: () => void;
  onSave: (
    data: Omit<LongTermGoal, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => string | null;
  onDelete: (id: string) => void;
  onSpawnTask: (goalId: string, title: string, quadrant: QuadrantId) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const SERVING_MEN_FIELDS: Array<{
  key: 'what' | 'why' | 'when' | 'how' | 'where' | 'who';
  label: string;
  prompt: string;
  placeholder: string;
}> = [
  {
    key: 'what',
    label: '1. What',
    prompt: 'Exact goal and measurable deliverable',
    placeholder: 'Define the concrete, unambiguous outcome and measurable deliverable...',
  },
  {
    key: 'why',
    label: '2. Why',
    prompt: 'Core motivation and strategic alignment',
    placeholder: 'Why does this truly matter? What deeper values or life direction does it serve?',
  },
  {
    key: 'when',
    label: '3. When',
    prompt: 'Key milestones and final deadline',
    placeholder: 'List checkpoint dates, phase deadlines, and the final target date...',
  },
  {
    key: 'how',
    label: '4. How',
    prompt: 'Execution strategy and required resources',
    placeholder: 'How will this be executed? Outline core strategy, budget, skills, and systems...',
  },
  {
    key: 'where',
    label: '5. Where',
    prompt: 'Environment, market, or operating context',
    placeholder: 'Which market, domain, physical environment, or digital ecosystem?',
  },
  {
    key: 'who',
    label: '6. Who',
    prompt: 'Stakeholders, mentors, and accountability',
    placeholder: 'Who is affected? Who can mentor, collaborate, or hold you accountable?',
  },
];

export function LongTermGoalModal({
  isOpen,
  goal,
  linkedTaskCount,
  onClose,
  onSave,
  onDelete,
  onSpawnTask,
  onNotify,
}: LongTermGoalModalProps) {
  const [activeGoalId, setActiveGoalId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<LongTermGoalStatus>('draft');
  const [fields, setFields] = useState({
    what: '',
    why: '',
    when: '',
    how: '',
    where: '',
    who: '',
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskQuadrant, setNewTaskQuadrant] = useState<QuadrantId>('schedule');

  useEffect(() => {
    if (!isOpen) return;
    if (goal) {
      setActiveGoalId(goal.id);
      setTitle(goal.title);
      setStatus(goal.status);
      setFields({
        what: goal.what,
        why: goal.why,
        when: goal.when,
        how: goal.how,
        where: goal.where,
        who: goal.who,
      });
    } else {
      setActiveGoalId(undefined);
      setTitle('');
      setStatus('draft');
      setFields({ what: '', why: '', when: '', how: '', where: '', who: '' });
    }
    setNewTaskTitle('');
    setNewTaskQuadrant('schedule');
  }, [isOpen, goal]);

  if (!isOpen) return null;

  const answeredCount = countServingMenAnswered(fields);
  const isLockedOrAchieved = status === 'locked' || status === 'achieved';

  const saveWithStatus = (targetStatus: LongTermGoalStatus): string | null => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      onNotify('Please enter a Long-Term Goal title.', 'error');
      return null;
    }

    const cleanedFields = {
      what: fields.what.trim(),
      why: fields.why.trim(),
      when: fields.when.trim(),
      how: fields.how.trim(),
      where: fields.where.trim(),
      who: fields.who.trim(),
    };

    if (targetStatus === 'locked' && countServingMenAnswered(cleanedFields) < 6) {
      onNotify(
        'Complete all 6 Serving Men prompts (What, Why, When, How, Where, Who) before locking in.',
        'error'
      );
      return null;
    }

    const savedId = onSave(
      {
        title: trimmedTitle,
        status: targetStatus,
        ...cleanedFields,
      },
      activeGoalId
    );

    if (savedId) {
      setActiveGoalId(savedId);
      setStatus(targetStatus);
    }
    return savedId;
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const id = saveWithStatus('draft');
    if (id) {
      onNotify('Long-term goal draft saved.');
      onClose();
    }
  };

  const handleLockIn = () => {
    const id = saveWithStatus('locked');
    if (id) {
      onNotify('Goal locked in with full Six Honest Serving Men clarity.');
    }
  };

  const handleStatusChange = (nextStatus: LongTermGoalStatus) => {
    const id = saveWithStatus(nextStatus);
    if (id) {
      onNotify(
        nextStatus === 'achieved' ? 'Goal marked as achieved.' : 'Goal unlocked for revision.'
      );
    }
  };

  const handleSpawn = () => {
    if (!activeGoalId) return;
    const trimmed = newTaskTitle.trim();
    if (!trimmed) {
      onNotify('Enter a tactical task title first.', 'error');
      return;
    }
    onSpawnTask(activeGoalId, trimmed, newTaskQuadrant);
    setNewTaskTitle('');
  };

  const statusMeta: Record<LongTermGoalStatus, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'text-amber-700' },
    locked: { label: 'Locked In', className: 'text-indigo-700' },
    achieved: { label: 'Achieved', className: 'text-emerald-700' },
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lt-modal-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-enter bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Mountain className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="lt-modal-heading" className="text-base font-semibold text-slate-900 truncate">
                Six Honest Serving Men Workspace
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Clarify all six prompts before locking in an irreversible commitment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close workspace"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form id="lt-goal-form" onSubmit={handleSaveDraft} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Clean Unboxed Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="flex-1">
              <label htmlFor="lt-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Long-Term Goal Title
              </label>
              <input
                id="lt-title"
                type="text"
                required
                readOnly={isLockedOrAchieved}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Launch Independent B2B SaaS to $10k MRR"
                className={`w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 ${
                  isLockedOrAchieved ? 'bg-slate-50 text-slate-600' : 'bg-white text-slate-900'
                }`}
              />
            </div>

            <div className="flex items-center gap-3 text-xs font-medium pb-2.5 shrink-0">
              <span className={`font-mono tabular-nums font-semibold ${answeredCount === 6 ? 'text-emerald-700' : 'text-slate-600'}`}>
                {answeredCount}/6 Answered
              </span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className={`font-semibold inline-flex items-center gap-1 ${statusMeta[status].className}`}>
                {status === 'locked' && <Lock className="w-3.5 h-3.5" />}
                {status === 'achieved' && <Award className="w-3.5 h-3.5" />}
                <span>{statusMeta[status].label}</span>
              </span>
            </div>
          </div>

          {/* 6 Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SERVING_MEN_FIELDS.map(({ key, label, prompt, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label htmlFor={`lt-${key}`} className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{label}</span>
                  <span className="text-xs text-slate-500 truncate">{prompt}</span>
                </label>
                <textarea
                  id={`lt-${key}`}
                  rows={3}
                  readOnly={isLockedOrAchieved}
                  value={fields[key]}
                  onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={`w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 ${
                    isLockedOrAchieved ? 'bg-slate-50 text-slate-600' : 'bg-white text-slate-900'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Bridge to Eisenhower Matrix */}
          {activeGoalId && (
            <div className="pt-5 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                  <span>Break Down into Eisenhower Matrix Task</span>
                </h4>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {linkedTaskCount} linked {linkedTaskCount === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSpawn();
                    }
                  }}
                  placeholder="Next concrete tactical step for this goal..."
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500"
                />
                <select
                  aria-label="Target quadrant for new task"
                  value={newTaskQuadrant}
                  onChange={(e) => setNewTaskQuadrant(e.target.value as QuadrantId)}
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  <option value="do">1. Do First</option>
                  <option value="schedule">2. Schedule</option>
                  <option value="delegate">3. Delegate</option>
                  <option value="eliminate">4. Eliminate</option>
                </select>
                <button
                  type="button"
                  onClick={handleSpawn}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  Add to Matrix
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {activeGoalId && (
              <button
                type="button"
                onClick={() => onDelete(activeGoalId)}
                className="min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            {isLockedOrAchieved && (
              <button
                type="button"
                onClick={() => handleStatusChange('draft')}
                className="min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock to Edit</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition-colors whitespace-nowrap shrink-0"
            >
              Close
            </button>
            {status === 'draft' && (
              <>
                <button
                  type="submit"
                  form="lt-goal-form"
                  className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleLockIn}
                  className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock In Goal</span>
                </button>
              </>
            )}
            {status === 'locked' && (
              <button
                type="button"
                onClick={() => handleStatusChange('achieved')}
                className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Award className="w-4 h-4" />
                <span>Mark Achieved</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
