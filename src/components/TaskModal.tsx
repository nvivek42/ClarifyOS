import React, { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { LongTermGoal, QuadrantId, ShortTermExperiment, TaskItem } from '../types';

interface TaskModalProps {
  task: TaskItem | null;
  longTermGoals: LongTermGoal[];
  experiments: ShortTermExperiment[];
  onClose: () => void;
  onSave: (updated: { id: string; title: string; quadrant: QuadrantId; goalId: string | null; notes: string }) => void;
  onDelete: (id: string) => void;
}

export function TaskModal({
  task,
  longTermGoals,
  experiments,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState<QuadrantId>('do');
  const [goalId, setGoalId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setQuadrant(task.quadrant);
      setGoalId(task.goalId || '');
      setNotes(task.notes || '');
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      id: task.id,
      title: trimmed,
      quadrant,
      goalId: goalId || null,
      notes: notes.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-enter bg-white rounded-2xl border border-zinc-200/90 shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 id="task-modal-title" className="text-base font-bold text-zinc-900 tracking-tight">
            Edit Task
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="edit-task-title" className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Task Title
            </label>
            <input
              id="edit-task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="edit-task-quadrant" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Eisenhower Quadrant
              </label>
              <select
                id="edit-task-quadrant"
                value={quadrant}
                onChange={(e) => setQuadrant(e.target.value as QuadrantId)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
              >
                <option value="do">1. Do First (Urgent &amp; Important)</option>
                <option value="schedule">2. Schedule (Important)</option>
                <option value="delegate">3. Delegate (Urgent)</option>
                <option value="eliminate">4. Eliminate (Neither)</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-task-goal" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Linked Goal or Experiment
              </label>
              <select
                id="edit-task-goal"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
              >
                <option value="">No Linked Goal</option>
                {longTermGoals.length > 0 && (
                  <optgroup label="Long-Term Goals">
                    {longTermGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        Goal: {g.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {experiments.length > 0 && (
                  <optgroup label="Short-Term Experiments">
                    {experiments.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        Experiment: {exp.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-task-notes" className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Context / Notes (Optional)
            </label>
            <textarea
              id="edit-task-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details, links, or definition of done..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
