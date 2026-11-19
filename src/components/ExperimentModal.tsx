import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Clock,
  FlaskConical,
  Play,
  RefreshCw,
  Trash2,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import { formatTimestamp, generateId } from '../data/seedData';
import { FeedbackEntry, QuadrantId, ReassessmentStatus, ShortTermExperiment } from '../types';

interface ExperimentModalProps {
  isOpen: boolean;
  experiment: ShortTermExperiment | null;
  linkedTaskCount: number;
  onClose: () => void;
  onSave: (
    data: Omit<ShortTermExperiment, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => void;
  onDelete: (id: string) => void;
  onSpawnTask: (goalId: string, title: string, quadrant: QuadrantId) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const REASSESSMENT_OPTIONS: Array<{
  value: ReassessmentStatus;
  label: string;
  activeClass: string;
  icon: typeof Play;
}> = [
  {
    value: 'persevere',
    label: 'Persevere',
    activeClass: 'bg-indigo-600 text-white border-indigo-600',
    icon: Play,
  },
  {
    value: 'pivot',
    label: 'Pivot',
    activeClass: 'bg-amber-600 text-white border-amber-600',
    icon: RefreshCw,
  },
  {
    value: 'scale',
    label: 'Scale',
    activeClass: 'bg-emerald-600 text-white border-emerald-600',
    icon: TrendingUp,
  },
  {
    value: 'drop',
    label: 'Drop',
    activeClass: 'bg-rose-600 text-white border-rose-600',
    icon: XCircle,
  },
];

export function ExperimentModal({
  isOpen,
  experiment,
  linkedTaskCount,
  onClose,
  onSave,
  onDelete,
  onSpawnTask,
  onNotify,
}: ExperimentModalProps) {
  const [title, setTitle] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [actionSteps, setActionSteps] = useState('');
  const [feedbackLog, setFeedbackLog] = useState<FeedbackEntry[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [reassessment, setReassessment] = useState<ReassessmentStatus>('persevere');
  const [nextIteration, setNextIteration] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskQuadrant, setNewTaskQuadrant] = useState<QuadrantId>('do');

  useEffect(() => {
    if (!isOpen) return;
    if (experiment) {
      setTitle(experiment.title);
      setTimeframe(experiment.timeframe);
      setHypothesis(experiment.hypothesis);
      setActionSteps(experiment.actionSteps);
      setFeedbackLog(experiment.feedbackLog ? [...experiment.feedbackLog] : []);
      setReassessment(experiment.reassessment);
      setNextIteration(experiment.nextIteration);
    } else {
      setTitle('');
      setTimeframe('');
      setHypothesis('');
      setActionSteps('');
      setFeedbackLog([]);
      setReassessment('persevere');
      setNextIteration('');
    }
    setNewFeedback('');
    setNewTaskTitle('');
    setNewTaskQuadrant('do');
  }, [isOpen, experiment]);

  if (!isOpen) return null;

  const handleAddFeedback = () => {
    const trimmed = newFeedback.trim();
    if (!trimmed) return;
    setFeedbackLog((prev) => [
      ...prev,
      {
        id: generateId('log'),
        timestamp: formatTimestamp(new Date()),
        note: trimmed,
      },
    ]);
    setNewFeedback('');
  };

  const handleRemoveFeedback = (id: string) => {
    setFeedbackLog((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      onNotify('Please enter an Experiment title.', 'error');
      return;
    }

    const finalLogs = [...feedbackLog];
    const pendingFeedback = newFeedback.trim();
    if (pendingFeedback) {
      finalLogs.push({
        id: generateId('log'),
        timestamp: formatTimestamp(new Date()),
        note: pendingFeedback,
      });
    }

    onSave(
      {
        title: trimmedTitle,
        timeframe: timeframe.trim() || '1-Week Sprint',
        hypothesis: hypothesis.trim(),
        actionSteps: actionSteps.trim(),
        feedbackLog: finalLogs,
        reassessment,
        nextIteration: nextIteration.trim(),
      },
      experiment?.id
    );
    onClose();
  };

  const handleSpawn = () => {
    if (!experiment) return;
    const trimmed = newTaskTitle.trim();
    if (!trimmed) {
      onNotify('Enter a tactical task title first.', 'error');
      return;
    }
    onSpawnTask(experiment.id, trimmed, newTaskQuadrant);
    setNewTaskTitle('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exp-modal-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-enter bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="exp-modal-heading" className="text-base font-semibold text-slate-900 truncate">
                Experiment &amp; Feedback Log
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Test hypotheses rapidly, record observations, and re-assess.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close experiment workspace"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form id="experiment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="exp-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Experiment Title
              </label>
              <input
                id="exp-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 14-Day Morning Deep Work Sprint"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="exp-timeframe" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Timeframe / Cycle
              </label>
              <input
                id="exp-timeframe"
                type="text"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="e.g., 2 Weeks"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-hypothesis" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hypothesis / Objective
              </label>
              <textarea
                id="exp-hypothesis"
                rows={3}
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="If [action], then [expected measurable outcome] because..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="exp-actions" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Action Steps
              </label>
              <textarea
                id="exp-actions"
                rows={3}
                value={actionSteps}
                onChange={(e) => setActionSteps(e.target.value)}
                placeholder={'1. Concrete step one\n2. Concrete step two'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Chronological Feedback Log (separated by hairline border, no nested card box) */}
          <div className="pt-5 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Chronological Feedback Log</span>
              </h4>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {feedbackLog.length} {feedbackLog.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {feedbackLog.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">
                No observations logged yet. Record your first check-in below.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-56 overflow-y-auto">
                {feedbackLog.map((entry) => (
                  <div key={entry.id} className="px-3.5 py-2.5 flex items-start justify-between gap-3 bg-white">
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-xs font-mono tabular-nums font-medium text-emerald-700 block">
                        {entry.timestamp}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">{entry.note}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeedback(entry.id)}
                      aria-label="Remove log entry"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeedback();
                  }
                }}
                placeholder="Record an observation, metric, or friction point..."
                className="flex-1 min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddFeedback}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Log Note
              </button>
            </div>
          </div>

          {/* Re-assessment Status & Next Iteration */}
          <div className="pt-5 border-t border-slate-200 space-y-4">
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                Re-assessment Status
              </span>
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
                role="radiogroup"
                aria-label="Experiment Re-assessment Status"
              >
                {REASSESSMENT_OPTIONS.map(({ value, label, activeClass, icon: Icon }) => {
                  const selected = reassessment === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setReassessment(value)}
                      className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                        selected
                          ? activeClass
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="exp-next-iteration" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Next Iteration Note
              </label>
              <textarea
                id="exp-next-iteration"
                rows={2}
                value={nextIteration}
                onChange={(e) => setNextIteration(e.target.value)}
                placeholder="What specific tweak or follow-up action comes next based on your feedback?"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Bridge to Eisenhower Matrix */}
          {experiment && (
            <div className="pt-5 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-emerald-700" />
                  <span>Send Action Step to Eisenhower Matrix</span>
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
                  placeholder="Tactical task for this experiment..."
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
                />
                <select
                  aria-label="Target quadrant for experiment task"
                  value={newTaskQuadrant}
                  onChange={(e) => setNewTaskQuadrant(e.target.value as QuadrantId)}
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                >
                  <option value="do">1. Do First</option>
                  <option value="schedule">2. Schedule</option>
                  <option value="delegate">3. Delegate</option>
                  <option value="eliminate">4. Eliminate</option>
                </select>
                <button
                  type="button"
                  onClick={handleSpawn}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  Add to Matrix
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2.5 shrink-0">
          {experiment ? (
            <button
              type="button"
              onClick={() => onDelete(experiment.id)}
              className="min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="experiment-form"
              className="min-h-[44px] px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              Save Experiment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
