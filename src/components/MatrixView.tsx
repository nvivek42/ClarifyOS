import React, { useState } from 'react';
import {
  Check,
  Filter,
  FlaskConical,
  GripVertical,
  Mountain,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { LongTermGoal, QuadrantId, ShortTermExperiment, TaskItem } from '../types';

interface MatrixViewProps {
  tasks: TaskItem[];
  longTermGoals: LongTermGoal[];
  experiments: ShortTermExperiment[];
  onAddTask: (title: string, quadrant: QuadrantId, goalId: string | null) => void;
  onToggleComplete: (id: string) => void;
  onMoveQuadrant: (id: string, quadrant: QuadrantId) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
  onJumpToGoal: (goalId: string) => void;
}

const QUADRANTS: Array<{
  id: QuadrantId;
  shortTitle: string;
  title: string;
  subtitle: string;
  topAccentClass: string;
  countClass: string;
}> = [
  {
    id: 'do',
    shortTitle: 'Do First',
    title: '1. Do First',
    subtitle: 'Urgent & Important — Critical commitments and deadlines',
    topAccentClass: 'border-t-2 border-t-rose-600',
    countClass: 'text-rose-700',
  },
  {
    id: 'schedule',
    shortTitle: 'Schedule',
    title: '2. Schedule',
    subtitle: 'Not Urgent & Important — Strategy, deep work, and long-term goals',
    topAccentClass: 'border-t-2 border-t-indigo-600',
    countClass: 'text-indigo-700',
  },
  {
    id: 'delegate',
    shortTitle: 'Delegate',
    title: '3. Delegate',
    subtitle: 'Urgent & Not Important — Interruptions, admin, and handoffs',
    topAccentClass: 'border-t-2 border-t-amber-600',
    countClass: 'text-amber-700',
  },
  {
    id: 'eliminate',
    shortTitle: 'Eliminate',
    title: '4. Eliminate',
    subtitle: 'Not Urgent & Not Important — Distractions and low-value busywork',
    topAccentClass: 'border-t-2 border-t-slate-400',
    countClass: 'text-slate-600',
  },
];

export function MatrixView({
  tasks,
  longTermGoals,
  experiments,
  onAddTask,
  onToggleComplete,
  onMoveQuadrant,
  onEditTask,
  onDeleteTask,
  onClearCompleted,
  onJumpToGoal,
}: MatrixViewProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickQuadrant, setQuickQuadrant] = useState<QuadrantId>('do');
  const [quickGoalId, setQuickGoalId] = useState('');
  const [goalFilter, setGoalFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [mobileQuadrant, setMobileQuadrant] = useState<QuadrantId | 'all'>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<QuadrantId | null>(null);

  const completedTotal = tasks.filter((t) => t.completed).length;

  const findGoalInfo = (goalId: string | null) => {
    if (!goalId) return null;
    const lt = longTermGoals.find((g) => g.id === goalId);
    if (lt) return { type: 'long-term' as const, id: lt.id, title: lt.title };
    const exp = experiments.find((e) => e.id === goalId);
    if (exp) return { type: 'experiment' as const, id: exp.id, title: exp.title };
    return null;
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    onAddTask(trimmed, quickQuadrant, quickGoalId || null);
    setQuickTitle('');
  };

  return (
    <section className="space-y-5" aria-label="Eisenhower Matrix">
      {/* Quick Add & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5">
        <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
          <div className="lg:col-span-5">
            <label htmlFor="quick-task-title" className="sr-only">
              New task title
            </label>
            <input
              id="quick-task-title"
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Add a tactical task (e.g., Draft Q4 outreach email)..."
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-5 gap-2.5">
            <div>
              <label htmlFor="quick-task-quadrant" className="sr-only">
                Quadrant
              </label>
              <select
                id="quick-task-quadrant"
                value={quickQuadrant}
                onChange={(e) => setQuickQuadrant(e.target.value as QuadrantId)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 transition-colors"
              >
                <option value="do">1. Do First (Urgent &amp; Important)</option>
                <option value="schedule">2. Schedule (Important, Not Urgent)</option>
                <option value="delegate">3. Delegate (Urgent, Not Important)</option>
                <option value="eliminate">4. Eliminate (Neither)</option>
              </select>
            </div>

            <div>
              <label htmlFor="quick-task-goal" className="sr-only">
                Link to Goal
              </label>
              <select
                id="quick-task-goal"
                value={quickGoalId}
                onChange={(e) => setQuickGoalId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 transition-colors"
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

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </form>

        {/* Filter & Display Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Goal Filter</span>
            </span>
            <select
              aria-label="Filter tasks by goal"
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            >
              <option value="all">All Tasks</option>
              <option value="unlinked">Unlinked Tasks Only</option>
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

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none min-h-[40px]">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>Show Completed</span>
            </label>

            {completedTotal > 0 && (
              <button
                type="button"
                onClick={onClearCompleted}
                className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                Clear Completed ({completedTotal})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Quadrant Switcher */}
      <div
        className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Mobile Quadrant Filter"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileQuadrant === 'all'}
          onClick={() => setMobileQuadrant('all')}
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
            mobileQuadrant === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {QUADRANTS.map((q) => (
          <button
            key={q.id}
            type="button"
            role="tab"
            aria-selected={mobileQuadrant === q.id}
            onClick={() => setMobileQuadrant(q.id)}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
              mobileQuadrant === q.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {q.shortTitle}
          </button>
        ))}
      </div>

      {/* 2x2 Eisenhower Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((quad) => {
          const isHiddenOnMobile = mobileQuadrant !== 'all' && mobileQuadrant !== quad.id;
          let qTasks = tasks.filter((t) => t.quadrant === quad.id);

          if (goalFilter === 'unlinked') {
            qTasks = qTasks.filter((t) => !t.goalId);
          } else if (goalFilter !== 'all') {
            qTasks = qTasks.filter((t) => t.goalId === goalFilter);
          }

          if (!showCompleted) {
            qTasks = qTasks.filter((t) => !t.completed);
          }

          qTasks.sort(
            (a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt
          );

          const activeCount = qTasks.filter((t) => !t.completed).length;
          const isDragOver = dragOverQuadrant === quad.id;

          return (
            <div
              key={quad.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverQuadrant !== quad.id) setDragOverQuadrant(quad.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverQuadrant(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverQuadrant(null);
                const id = draggedTaskId || e.dataTransfer.getData('text/plain');
                if (id) onMoveQuadrant(id, quad.id);
                setDraggedTaskId(null);
              }}
              className={`${
                isHiddenOnMobile ? 'hidden md:flex' : 'flex'
              } flex-col bg-white rounded-xl border border-slate-200 ${quad.topAccentClass} min-h-[290px] transition-colors ${
                isDragOver ? 'bg-indigo-50/40 ring-2 ring-indigo-500/40' : ''
              }`}
            >
              {/* Quadrant Header */}
              <div className="px-4 py-3.5 border-b border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{quad.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{quad.subtitle}</p>
                </div>
                <span className={`text-xs font-mono tabular-nums font-semibold shrink-0 pt-0.5 ${quad.countClass}`}>
                  {activeCount} active
                </span>
              </div>

              {/* Task List */}
              <div className="p-3.5 flex-1 flex flex-col">
                {qTasks.length === 0 ? (
                  <div className="flex-1 min-h-[170px] flex flex-col items-center justify-center text-center px-4 py-6 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    <p className="text-xs font-medium text-slate-500">No tasks in {quad.shortTitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Add a task above or drag one here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {qTasks.map((task) => {
                      const goalInfo = findGoalInfo(task.goalId);
                      const isDragging = draggedTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedTaskId(task.id);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', task.id);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverQuadrant(null);
                          }}
                          className={`group py-3 first:pt-1 last:pb-1 transition-opacity ${
                            isDragging ? 'opacity-40' : 'opacity-100'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {/* Accessible 44x44 touch target checkbox */}
                            <button
                              type="button"
                              onClick={() => onToggleComplete(task.id)}
                              aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                              className="min-w-[44px] min-h-[44px] -ml-2 -mt-2 flex items-center justify-center shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                            >
                              <span
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  task.completed
                                    ? 'bg-slate-900 border-slate-900 text-white'
                                    : 'border-slate-300 bg-white group-hover:border-slate-500'
                                }`}
                              >
                                {task.completed && <Check className="w-3.5 h-3.5" />}
                              </span>
                            </button>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium leading-snug ${
                                  task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.notes && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                  {task.notes}
                                </p>
                              )}

                              {goalInfo && (
                                <div className="mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => onJumpToGoal(goalInfo.id)}
                                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors max-w-full hover:underline ${
                                      goalInfo.type === 'long-term'
                                        ? 'text-indigo-700 hover:text-indigo-900'
                                        : 'text-emerald-700 hover:text-emerald-900'
                                    }`}
                                    title="Open linked goal"
                                  >
                                    {goalInfo.type === 'long-term' ? (
                                      <Mountain className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                      <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                    <span className="truncate">{goalInfo.title}</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <div
                              className="hidden sm:flex items-center text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing pt-0.5 shrink-0"
                              title="Drag to move quadrant"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Task Actions Row */}
                          <div className="mt-2 pl-7 flex items-center justify-between gap-2">
                            <select
                              aria-label="Move task to quadrant"
                              value={task.quadrant}
                              onChange={(e) => onMoveQuadrant(task.id, e.target.value as QuadrantId)}
                              className="min-h-[40px] px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                            >
                              <option value="do">Move: Do First</option>
                              <option value="schedule">Move: Schedule</option>
                              <option value="delegate">Move: Delegate</option>
                              <option value="eliminate">Move: Eliminate</option>
                            </select>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditTask(task)}
                                aria-label="Edit task"
                                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTask(task.id)}
                                aria-label="Delete task"
                                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
