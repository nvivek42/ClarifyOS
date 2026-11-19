import { ArrowRight, FlaskConical, Play, Plus, RefreshCw, TrendingUp, XCircle } from 'lucide-react';
import { ReassessmentStatus, ShortTermExperiment, TaskItem } from '../types';

interface ExperimentsViewProps {
  experiments: ShortTermExperiment[];
  tasks: TaskItem[];
  onOpenExperiment: (experiment: ShortTermExperiment | null) => void;
}

const REASSESSMENT_META: Record<
  ReassessmentStatus,
  { label: string; className: string; icon: typeof Play }
> = {
  persevere: {
    label: 'Persevere',
    className: 'text-indigo-700 bg-indigo-50/70 border border-indigo-200/70',
    icon: Play,
  },
  pivot: {
    label: 'Pivot',
    className: 'text-amber-800 bg-amber-50/70 border border-amber-200/70',
    icon: RefreshCw,
  },
  scale: {
    label: 'Scale',
    className: 'text-emerald-800 bg-emerald-50/70 border border-emerald-200/70',
    icon: TrendingUp,
  },
  drop: {
    label: 'Drop',
    className: 'text-rose-700 bg-rose-50/70 border border-rose-200/70',
    icon: XCircle,
  },
};

export function ExperimentsView({
  experiments,
  tasks,
  onOpenExperiment,
}: ExperimentsViewProps) {
  return (
    <section className="space-y-4" aria-label="Short-Term Experiments">
      {/* Section Header */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="max-w-2xl space-y-1">
          <p className="text-xs font-semibold text-emerald-800 tracking-wide">
            Rapid Feedback Loops
          </p>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            Short-Term Goals &amp; Experiments
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Keep low-stakes bets lightweight. State a hypothesis, run action steps, log real-world observations, and decide:{' '}
            <strong className="font-semibold text-zinc-800">Persevere, Pivot, Scale, or Drop</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenExperiment(null)}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Experiment</span>
        </button>
      </div>

      {/* Experiments Grid */}
      {experiments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center mx-auto">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900">No Short-Term Experiments Yet</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              Test habits, workflows, or tactical bets in short cycles with chronological feedback logs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenExperiment(null)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Start First Experiment</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experiments.map((exp) => {
            const meta = REASSESSMENT_META[exp.reassessment] || REASSESSMENT_META.persevere;
            const StatusIcon = meta.icon;
            const logsCount = exp.feedbackLog?.length || 0;
            const latestLog = logsCount > 0 ? exp.feedbackLog[logsCount - 1] : null;
            const linkedCount = tasks.filter((t) => t.goalId === exp.id).length;

            return (
              <article
                key={exp.id}
                onClick={() => onOpenExperiment(exp)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenExperiment(exp);
                  }
                }}
                className="cursor-pointer bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-300 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-xs font-medium text-zinc-500 block">
                        {exp.timeframe || 'Sprint'}
                      </span>
                      <h3 className="text-base font-bold text-zinc-900 leading-snug tracking-tight">
                        {exp.title}
                      </h3>
                    </div>

                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0 ${meta.className}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  {/* Clean hairline-separated previews */}
                  <div className="divide-y divide-zinc-100 border-t border-zinc-100 text-xs">
                    <div className="py-2.5">
                      <span className="font-semibold text-zinc-700 block mb-0.5">Hypothesis</span>
                      <p className="text-zinc-600 line-clamp-2 leading-relaxed">
                        {exp.hypothesis || <span className="italic text-zinc-400">No hypothesis recorded</span>}
                      </p>
                    </div>
                    {latestLog && (
                      <div className="pt-2.5">
                        <span className="font-mono tabular-nums font-semibold text-emerald-800 block mb-0.5">
                          Latest · {latestLog.timestamp}
                        </span>
                        <p className="text-zinc-600 line-clamp-1 leading-relaxed">
                          {latestLog.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unboxed metadata footer */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-500 font-mono tabular-nums">
                    <span>
                      {logsCount} {logsCount === 1 ? 'log' : 'logs'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {linkedCount} Matrix {linkedCount === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <span className="text-emerald-800 font-semibold inline-flex items-center gap-1 whitespace-nowrap hover:underline">
                    <span>Inspect</span>
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
