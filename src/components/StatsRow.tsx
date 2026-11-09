import type { SlotCounts } from '../types';
import { IconBed, IconCheck, IconDroplet, IconPlus } from './icons';

interface Props {
  counts: SlotCounts;
  avgUf: number;
}

const tiles = [
  {
    key: 'total' as const,
    label: 'إجمالي الأسرّة',
    hint: 'وحدة الغسيل',
    icon: IconBed,
    tone: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  {
    key: 'active' as const,
    label: 'جلسات قيد الغسيل',
    hint: 'على الماكينات الآن',
    icon: IconDroplet,
    tone: 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300',
  },
  {
    key: 'completed' as const,
    label: 'جلسات مكتملة',
    hint: 'بانتظار إخلاء السرير',
    icon: IconCheck,
    tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  },
  {
    key: 'available' as const,
    label: 'أسرّة متاحة',
    hint: 'جاهزة لاستقبال مريض',
    icon: IconPlus,
    tone: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300',
  },
];

export default function StatsRow({ counts, avgUf }: Props) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div key={tile.key} className="card-surface flex items-center gap-3 p-3.5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${tile.tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="num text-xl font-extrabold leading-none text-slate-900 dark:text-slate-50">
                {counts[tile.key]}
              </p>
              <p className="mt-1 truncate text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                {tile.label}
              </p>
            </div>
          </div>
        );
      })}
      <p className="col-span-2 hidden text-[11px] text-slate-400 lg:col-span-4 lg:block">
        متوسط تقدم جلسات السحب الحالية: <span className="num font-bold text-brand-600 dark:text-brand-300">{avgUf}%</span>
      </p>
    </section>
  );
}
