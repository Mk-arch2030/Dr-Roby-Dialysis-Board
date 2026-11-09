import type { FilterKey, SlotCounts } from '../types';

interface Props {
  value: FilterKey;
  counts: SlotCounts;
  onChange: (key: FilterKey) => void;
}

export default function FilterTabs({ value, counts, onChange }: Props) {
  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'كل الأسرّة', count: counts.total },
    { key: 'active', label: 'قيد الغسيل', count: counts.active },
    { key: 'completed', label: 'مكتملة', count: counts.completed },
    { key: 'available', label: 'متاحة', count: counts.available },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 dark:border-slate-700/70 dark:bg-slate-900/70">
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-bold transition ${
              active
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/25'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
            <span
              className={`num rounded-md px-1.5 py-0.5 text-[10.5px] ${
                active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
