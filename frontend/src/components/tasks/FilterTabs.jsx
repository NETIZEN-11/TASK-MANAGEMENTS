import { TASK_FILTERS } from '../../constants';

const ACTIVE_GRADIENTS = {
  all: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/30',
  pending: 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 shadow-lg shadow-amber-500/30',
  completed: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 shadow-lg shadow-emerald-500/30',
};

export default function FilterTabs({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {TASK_FILTERS.map((f) => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={
              active
                ? `rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 ${ACTIVE_GRADIENTS[f.key] || 'bg-brand-600'}`
                : 'rounded-lg px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-800'
            }
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
