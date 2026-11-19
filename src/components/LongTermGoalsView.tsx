import { ArrowRight, Award, Lock, Mountain, Plus } from 'lucide-react';
import { countServingMenAnswered } from '../data/seedData';
import { LongTermGoal, LongTermGoalStatus, TaskItem } from '../types';

interface LongTermGoalsViewProps {
  goals: LongTermGoal[];
  tasks: TaskItem[];
  onOpenGoal: (goal: LongTermGoal | null) => void;
}

const STATUS_META: Record<LongTermGoalStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'text-amber-800 bg-amber-50/70 border border-amber-200/70',
  },
  locked: {
    label: 'Locked In',
    className: 'text-indigo-700 bg-indigo-50/70 border border-indigo-200/70',
  },
  achieved: {
    label: 'Achieved',
    className: 'text-emerald-800 bg-emerald-50/70 border border-emerald-200/70',
  },
};

export function LongTermGoalsView({ goals, tasks, onOpenGoal }: LongTermGoalsViewProps) {
  return (
    <section className="space-y-4" aria-label="Long-Term Goals">
      {/* Section Header */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="max-w-2xl space-y-1">
          <p className="text-xs font-semibold text-indigo-700 tracking-wide">
            Irreversible &amp; High-Stakes Commitments
          </p>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            Long-Term Goals — Six Honest Serving Men
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Prevent impulsive strategic bets. Every long-term goal requires clarity across{' '}
            <strong className="font-semibold text-zinc-800">What, Why, When, How, Where,</strong>{' '}
            and <strong className="font-semibold text-zinc-800">Who</strong> before locking in.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenGoal(null)}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Long-Term Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center mx-auto">
            <Mountain className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900">No Long-Term Goals Yet</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              Use the Six Honest Serving Men framework to clarify high-stakes commitments before breaking them into daily tasks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenGoal(null)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
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
                className="cursor-pointer bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-300 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-zinc-900 leading-snug tracking-tight">
                      {goal.title}
                    </h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0 ${meta.className}`}>
                      {goal.status === 'locked' && <Lock className="w-3.5 h-3.5" />}
                      {goal.status === 'achieved' && <Award className="w-3.5 h-3.5" />}
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  {/* Clean hairline-separated previews */}
                  <div className="divide-y divide-zinc-100 border-t border-zinc-100 text-xs">
                    <div className="py-2.5">
                      <span className="font-semibold text-zinc-700 block mb-0.5">What</span>
                      <p className="text-zinc-600 line-clamp-2 leading-relaxed">
                        {goal.what || <span className="italic text-zinc-400">Not defined yet</span>}
                      </p>
                    </div>
                    <div className="pt-2.5">
                      <span className="font-semibold text-zinc-700 block mb-0.5">When</span>
                      <p className="text-zinc-600 line-clamp-1 leading-relaxed">
                        {goal.when || <span className="italic text-zinc-400">No timeline set</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unboxed metadata footer */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className={`font-mono tabular-nums font-semibold ${answered === 6 ? 'text-emerald-700' : 'text-zinc-700'}`}>
                      {answered}/6 Serving Men
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {linkedCount} Matrix {linkedCount === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <span className="text-indigo-700 font-semibold inline-flex items-center gap-1 whitespace-nowrap hover:underline">
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
