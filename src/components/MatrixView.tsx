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
  badgeClass: string;
}> = [
  {
    id: 'do',
    shortTitle: 'Do First',
    title: '1. Do First',
    subtitle: 'Urgent & Important — Deadlines & critical commitments',
    topAccentClass: 'border-t-2 border-t-rose-500',
    badgeClass: 'text-rose-700 bg-rose-50/70 border border-rose-200/60',
  },
  {
    id: 'schedule',
    shortTitle: 'Schedule',
    title: '2. Schedule',
    subtitle: 'Not Urgent & Important — Strategy & deep work focus',
    topAccentClass: 'border-t-2 border-t-indigo-500',
    badgeClass: 'text-indigo-700 bg-indigo-50/70 border border-indigo-200/60',
  },
  {
    id: 'delegate',
    shortTitle: 'Delegate',
    title: '3. Delegate',
    subtitle: 'Urgent & Not Important — Handoffs, interruptions & admin',
    topAccentClass: 'border-t-2 border-t-amber-500',
    badgeClass: 'text-amber-800 bg-amber-50/70 border border-amber-200/60',
  },
  {
    id: 'eliminate',
    shortTitle: 'Eliminate',
    title: '4. Eliminate',
    subtitle: 'Not Urgent & Not Important — Distractions & low-value noise',
    topAccentClass: 'border-t-2 border-t-zinc-400',
    badgeClass: 'text-zinc-700 bg-zinc-100/70 border border-zinc-200/60',
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
    <section className="space-y-4" aria-label="Eisenhower Matrix">
      {/* Quick Add & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs space-y-3.5">
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
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
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
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
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
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
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
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </form>

        {/* Filter & Display Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span>Goal Filter</span>
            </span>
            <select
              aria-label="Filter tasks by goal"
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
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
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 select-none min-h-[38px]">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span>Show Completed</span>
            </label>

            {completedTotal > 0 && (
              <button
                type="button"
                onClick={onClearCompleted}
                className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200 transition-colors whitespace-nowrap shrink-0"
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
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
            mobileQuadrant === 'all'
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
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
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
              mobileQuadrant === q.id
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
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
              } flex-col bg-white rounded-2xl border border-zinc-200/80 ${quad.topAccentClass} min-h-[300px] shadow-xs transition-colors ${
                isDragOver ? 'bg-indigo-50/40 ring-2 ring-indigo-500/30' : ''
              }`}
            >
              {/* Quadrant Header */}
              <div className="px-4 py-3.5 border-b border-zinc-100 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 tracking-tight">{quad.title}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-normal">{quad.subtitle}</p>
                </div>
                <span className={`text-[11px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md shrink-0 ${quad.badgeClass}`}>
                  {activeCount} active
                </span>
              </div>

              {/* Task List */}
              <div className="p-3.5 flex-1 flex flex-col">
                {qTasks.length === 0 ? (
                  <div className="flex-1 min-h-[170px] flex flex-col items-center justify-center text-center px-4 py-6 text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
                    <p className="text-xs font-semibold text-zinc-600">No tasks in {quad.shortTitle}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Add a task above or drag one here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
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
                              className="min-w-[44px] min-h-[44px] -ml-2 -mt-2 flex items-center justify-center shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                            >
                              <span
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                  task.completed
                                    ? 'bg-zinc-900 border-zinc-900 text-white'
                                    : 'border-zinc-300 bg-white group-hover:border-zinc-500'
                                }`}
                              >
                                {task.completed && <Check className="w-3.5 h-3.5" />}
                              </span>
                            </button>

                            <div className="flex-1 min-w-0 pt-0.5">
                              <p
                                className={`text-sm font-semibold leading-snug tracking-tight ${
                                  task.completed ? 'line-through text-zinc-400 font-normal' : 'text-zinc-900'
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.notes && (
                                <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                                  {task.notes}
                                </p>
                              )}

                              {goalInfo && (
                                <div className="mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => onJumpToGoal(goalInfo.id)}
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium transition-colors max-w-full border ${
                                      goalInfo.type === 'long-term'
                                        ? 'bg-indigo-50/70 text-indigo-700 border-indigo-200/60 hover:bg-indigo-100/70'
                                        : 'bg-emerald-50/70 text-emerald-800 border-emerald-200/60 hover:bg-emerald-100/70'
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
                              className="hidden sm:flex items-center text-zinc-300 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing pt-1 shrink-0"
                              title="Drag to move quadrant"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Task Actions Row */}
                          <div className="mt-2.5 pl-7 flex items-center justify-between gap-2">
                            <select
                              aria-label="Move task to quadrant"
                              value={task.quadrant}
                              onChange={(e) => onMoveQuadrant(task.id, e.target.value as QuadrantId)}
                              className="min-h-[38px] px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
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
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTask(task.id)}
                                aria-label="Delete task"
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
