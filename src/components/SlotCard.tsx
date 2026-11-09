import type { Slot } from '../types';
import { formatClock, formatHM, minutesSince, oneDecimal, remainingMinutes, ufPercent } from '../lib/utils';
import { IconActivity, IconBed, IconCheck, IconClock, IconHeart, IconPlus } from './icons';

interface Props {
  slot: Slot;
  now: number;
  onOpen: () => void;
  onStart: () => void;
  onDischarge: () => void;
}

function StatCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-center dark:bg-slate-800/60">
      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{label}</p>
      <p className="num mt-0.5 text-[13.5px] font-extrabold leading-none text-slate-800 dark:text-slate-100">
        {value}
        <span className="ms-0.5 text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">{unit}</span>
      </p>
    </div>
  );
}

export default function SlotCard({ slot, now, onOpen, onStart, onDischarge }: Props) {
  const session = slot.session;
  const number = `#${String(slot.id).padStart(2, '0')}`;

  if (!session) {
    return (
      <article className="flex h-full flex-col rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 transition hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/40">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              متاح
            </span>
            <span className="num text-sm font-extrabold text-slate-300 dark:text-slate-600">{number}</span>
          </div>
          <p className="text-left text-[12px] font-bold text-slate-500 dark:text-slate-400">{slot.machine}</p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <IconBed className="h-5 w-5" />
          </span>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">السرير متاح</p>
          <p className="max-w-[220px] text-[11.5px] leading-relaxed text-slate-400 dark:text-slate-500">
            لا توجد جلسة نشطة على هذه الماكينة — جاهز لاستقبال مريض
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="btn w-full border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-200 dark:hover:bg-brand-900/50"
        >
          <IconPlus className="h-4 w-4" />
          تسجيل مريض وبدء جلسة جديدة
        </button>
      </article>
    );
  }

  const pct = ufPercent(session.ufRemovedMl, session.ufGoalMl);
  const remaining = remainingMinutes(session.startedAt, session.durationMin, now);
  const elapsed = minutesSince(session.startedAt, now);
  const overtime = session.status === 'active' && remaining <= 0;
  const hours = session.durationMin / 60;

  if (session.status === 'completed') {
    const endTime = session.endedAt ? formatClock(session.endedAt) : '—';
    return (
      <article
        onClick={onOpen}
        className="flex h-full cursor-pointer flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-900/5 dark:border-amber-900/50 dark:bg-amber-950/20"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
              <IconCheck className="h-3 w-3" />
              مكتمل
            </span>
            <span className="num text-sm font-extrabold text-amber-300 dark:text-amber-700/70">{number}</span>
          </div>
          <div className="text-left">
            <p className="text-[12px] font-bold text-amber-900/80 dark:text-amber-100/90">{slot.machine}</p>
            <p className="text-[10px] text-amber-700/60 dark:text-amber-200/50">{session.access}</p>
          </div>
        </div>

        <div>
          <p className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100">{session.patient.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            ملف {session.patient.fileNo} · {session.patient.age} سنة
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <StatCell label="وزن قبل" value={oneDecimal(session.preWeight)} unit="كجم" />
          <StatCell label="وزن بعد" value={oneDecimal(session.dryWeight)} unit="كجم" />
          <StatCell label="إجمالي UF" value={String(session.ufRemovedMl)} unit="مل" />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white/70 px-2.5 py-1.5 text-[11px] dark:bg-slate-900/40">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
            <IconClock className="h-3.5 w-3.5" />
            انتهت الجلسة <span className="num font-bold text-slate-700 dark:text-slate-200">{endTime}</span>
          </span>
          <span className="num text-slate-400 dark:text-slate-500">{hours} ساعات · {session.qb} Qb</span>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDischarge();
            }}
            className="btn flex-1 bg-amber-600 text-white hover:bg-amber-700"
          >
            إخلاء السرير
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            className="btn border border-amber-200 bg-white/80 text-amber-700 hover:bg-white dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          >
            التفاصيل
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={onOpen}
      className={`flex h-full cursor-pointer flex-col gap-2.5 rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-900/5 dark:bg-slate-900/70 ${
        overtime
          ? 'border-rose-300 dark:border-rose-800/60'
          : 'border-brand-200/90 dark:border-brand-800/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              overtime
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
                : 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
            }`}
          >
            <span className={`pulse-dot h-1.5 w-1.5 rounded-full ${overtime ? 'bg-rose-500' : 'bg-brand-500'}`} />
            {overtime ? 'تجاوز الوقت' : 'قيد الغسيل'}
          </span>
          <span className="num text-sm font-extrabold text-slate-300 dark:text-slate-600">{number}</span>
        </div>
        <div className="text-left">
          <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{slot.machine}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{session.access}</p>
        </div>
      </div>

      <div>
        <p className="text-[15px] font-extrabold text-slate-900 dark:text-slate-50">{session.patient.name}</p>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          ملف {session.patient.fileNo} · {session.patient.age} سنة
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <StatCell label="الوزن الجاف" value={oneDecimal(session.dryWeight)} unit="كجم" />
        <StatCell label="الوزن الحالي" value={oneDecimal(session.preWeight)} unit="كجم" />
        <StatCell label="UF المطلوب" value={String(session.ufGoalMl)} unit="مل" />
      </div>

      <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-slate-500 dark:text-slate-400">
            UF المسحوب <span className="num text-brand-700 dark:text-brand-300">{pct}%</span>
          </span>
          <span className="num text-slate-500 dark:text-slate-400">
            {session.ufRemovedMl} / {session.ufGoalMl} مل
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-l from-brand-600 to-brand-400 transition-all duration-500"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
          <IconActivity className="h-3 w-3 text-brand-500" />
          Qb <span className="num">{session.qb}</span> مل/د
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
          <IconHeart className="h-3 w-3 text-rose-500" />
          <span className="num">{session.systolic ? `${session.systolic}/${session.diastolic}` : '—'}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
          نبض <span className="num">{session.pulse}</span>
        </span>
      </div>

      <div className="mt-auto space-y-2">
        <div
          className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] ${
            overtime ? 'bg-rose-50 dark:bg-rose-950/40' : 'bg-white ring-1 ring-slate-100 dark:bg-slate-900/60 dark:ring-slate-700'
          }`}
        >
          <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
            <IconClock className="h-3.5 w-3.5" />
            {overtime ? (
              <span className="font-bold text-rose-600 dark:text-rose-300">انتهى وقت الجلسة — يُرجى الإنهاء</span>
            ) : (
              <>
                متبقي <span className="num font-bold text-slate-800 dark:text-slate-100">{formatHM(remaining)}</span>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="num text-slate-400">{formatHM(session.durationMin)}</span>
              </>
            )}
          </span>
          <span className="num text-[10px] text-slate-400 dark:text-slate-500">
            بدأت {formatClock(session.startedAt)} · {formatHM(elapsed)} منقضية
          </span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="btn w-full border border-brand-200 bg-brand-50/70 text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-200 dark:hover:bg-brand-900/50"
        >
          <IconActivity className="h-4 w-4" />
          فتح الجلسة ومتابعتها
        </button>
      </div>
    </article>
  );
}
