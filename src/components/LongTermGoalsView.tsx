import { ArrowRight, Award, Lock, Mountain, Plus } from 'lucide-react';
import { countServingMenAnswered } from '../data/seedData';
import { LongTermGoal, LongTermGoalStatus, TaskItem } from '../types';

interface LongTermGoalsViewProps {
  goals: LongTermGoal[];
  tasks: TaskItem[];
  onOpenGoal: (goal: LongTermGoal | null) => void;
}

const STATUS_META: Record<LongTermGoalStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'text-amber-700' },
  locked: { label: 'Locked In', className: 'text-indigo-700' },
  achieved: { label: 'Achieved', className: 'text-emerald-700' },
};

export function LongTermGoalsView({ goals, tasks, onOpenGoal }: LongTermGoalsViewProps) {
  return (
    <section className="space-y-5" aria-label="Long-Term Goals">
      {/* Section Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="max-w-2xl space-y-1">
          <p className="text-xs font-medium text-indigo-700">Irreversible &amp; High-Stakes Commitments</p>
          <h2 className="text-lg font-semibold text-slate-900">
            Long-Term Goals — Six Honest Serving Men
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Prevent impulsive strategic bets. Every long-term goal requires clarity across{' '}
            <strong className="font-semibold text-slate-800">What, Why, When, How, Where,</strong>{' '}
            and <strong className="font-semibold text-slate-800">Who</strong> before locking in.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenGoal(null)}
          className="min-h-[44px] px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Long-Term Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center space-y-3">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <Mountain className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">No Long-Term Goals Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Use the Six Honest Serving Men framework to clarify high-stakes commitments before breaking them into daily tasks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenGoal(null)}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Define First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const answered = countServingMenAnswered(goal);
            const linkedCount = tasks.filter((t) => t.goalId === goal.id).length;
            const meta = STATUS_META[goal.status];

            return (
              <article
                key={goal.id}
                onClick={() => onOpenGoal(goal)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenGoal(goal);
                  }
                }}
                className="cursor-pointer bg-white rounded-xl border border-slate-200 hover:border-indigo-300 p-5 transition-colors flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900 leading-snug">
                      {goal.title}
                    </h3>
                    <span className={`text-xs font-semibold inline-flex items-center gap-1 shrink-0 ${meta.className}`}>
                      {goal.status === 'locked' && <Lock className="w-3.5 h-3.5" />}
                      {goal.status === 'achieved' && <Award className="w-3.5 h-3.5" />}
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  {/* Clean hairline-separated previews (no nested cards) */}
                  <div className="divide-y divide-slate-100 border-t border-slate-100 text-xs">
                    <div className="py-2.5">
                      <span className="font-semibold text-slate-700 block mb-0.5">What</span>
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">
                        {goal.what || <span className="italic text-slate-400">Not defined yet</span>}
                      </p>
                    </div>
                    <div className="pt-2.5">
                      <span className="font-semibold text-slate-700 block mb-0.5">When</span>
                      <p className="text-slate-600 line-clamp-1 leading-relaxed">
                        {goal.when || <span className="italic text-slate-400">No timeline set</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unboxed metadata footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className={`font-mono tabular-nums font-semibold ${answered === 6 ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {answered}/6 Serving Men
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {linkedCount} Matrix {linkedCount === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <span className="text-indigo-700 font-semibold inline-flex items-center gap-1 whitespace-nowrap">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
