import { useState } from 'react';
import type { Slot, Vital } from '../types';
import { formatClock, formatHM, minutesSince, oneDecimal, remainingMinutes, ufPercent } from '../lib/utils';
import { IconActivity, IconCheck, IconClock, IconClose, IconDroplet, IconHeart } from './icons';

interface Props {
  slot: Slot;
  now: number;
  onClose: () => void;
  onAddVital: (slotId: number, vital: Omit<Vital, 'id' | 'at'>) => void;
  onEndSession: (slotId: number) => void;
  onDischarge: (slotId: number) => void;
}

const emptyForm = { systolic: '', diastolic: '', pulse: '', ufRemovedMl: '', note: '' };

export default function SessionPanel({ slot, now, onClose, onAddVital, onEndSession, onDischarge }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const session = slot.session;

  if (!session) return null;

  const pct = ufPercent(session.ufRemovedMl, session.ufGoalMl);
  const remaining = remainingMinutes(session.startedAt, session.durationMin, now);
  const elapsed = minutesSince(session.startedAt, now);
  const isActive = session.status === 'active';

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const systolic = Number(form.systolic);
    const diastolic = Number(form.diastolic);
    const pulse = Number(form.pulse);
    const ufRemovedMl = Number(form.ufRemovedMl);

    if (!systolic || !diastolic || !pulse) {
      setError('أدخل الضغط الانقباضي والانبساطي والنبض.');
      return;
    }
    if (systolic < 50 || systolic > 260 || diastolic < 25 || diastolic > 160) {
      setError('قيم الضغط خارج النطاق المقبول (50–260 / 25–160).');
      return;
    }
    if (pulse < 30 || pulse > 200) {
      setError('قيمة النبض خارج النطاق المقبول (30–200).');
      return;
    }
    if (Number.isNaN(ufRemovedMl) || ufRemovedMl < 0) {
      setError('أدخل كمية UF مسحوبة صحيحة.');
      return;
    }

    onAddVital(slot.id, {
      systolic,
      diastolic,
      pulse,
      ufRemovedMl,
      note: form.note.trim() || undefined,
    });
    setForm(emptyForm);
    setError('');
  };

  const readings = [...session.vitals].reverse();

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="تفاصيل الجلسة">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />

      <section className="animate-slide-in relative z-10 flex h-full w-full flex-col overflow-y-auto bg-slate-50 shadow-2xl sm:max-w-md dark:bg-slate-950">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                سرير #{String(slot.id).padStart(2, '0')} · {slot.machine}
              </p>
              <h2 className="mt-0.5 text-[16px] font-extrabold text-slate-900 dark:text-slate-50">
                {session.patient.name}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                ملف {session.patient.fileNo} · {session.patient.age} سنة · {session.access}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-3 p-4">
          <div
            className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-[12px] font-bold ${
              isActive
                ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-200 dark:ring-brand-900'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {isActive ? <IconDroplet className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
              {isActive ? 'جلسة قيد التشغيل' : 'جلسة منتهية'}
            </span>
            <span className="num text-[11px] font-semibold">
              {isActive ? `متبقي ${formatHM(remaining)}` : `انتهت ${session.endedAt ? formatClock(session.endedAt) : ''}`}
            </span>
          </div>

          <div className="card-surface p-3.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>تقدم سحب السوائل</span>
              <span className="num">
                {session.ufRemovedMl} / {session.ufGoalMl} مل
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-l from-brand-600 to-brand-400 transition-all duration-500"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="num font-extrabold text-brand-700 dark:text-brand-300">{pct}%</span>
              <span className="text-slate-500 dark:text-slate-400">
                سريان {session.qb} مل/د · {session.durationMin} دقيقة
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="card-surface p-3">
              <p className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-400">
                <IconHeart className="h-3.5 w-3.5 text-rose-500" /> الضغط
              </p>
              <p className="num mt-1 text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {session.systolic ? `${session.systolic}/${session.diastolic}` : '—'}
              </p>
              <p className="text-[10.5px] text-slate-400">ملم زئبق</p>
            </div>
            <div className="card-surface p-3">
              <p className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-400">
                <IconActivity className="h-3.5 w-3.5 text-brand-500" /> النبض
              </p>
              <p className="num mt-1 text-lg font-extrabold text-slate-800 dark:text-slate-100">{session.pulse}</p>
              <p className="text-[10.5px] text-slate-400">نبضة/دقيقة</p>
            </div>
            <div className="card-surface p-3">
              <p className="text-[10.5px] font-semibold text-slate-400">الوزن قبل الجلسة</p>
              <p className="num mt-1 text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {oneDecimal(session.preWeight)}
                <span className="ms-1 text-[10px] font-semibold text-slate-400">كجم</span>
              </p>
              <p className="text-[10.5px] text-slate-400">الوزن الجاف {oneDecimal(session.dryWeight)} كجم</p>
            </div>
            <div className="card-surface p-3">
              <p className="text-[10.5px] font-semibold text-slate-400">الوقت</p>
              <p className="num mt-1 text-lg font-extrabold text-slate-800 dark:text-slate-100">{formatHM(elapsed)}</p>
              <p className="text-[10.5px] text-slate-400">بدأت {formatClock(session.startedAt)}</p>
            </div>
          </div>

          {isActive && (
            <form onSubmit={submit} className="card-surface space-y-2.5 p-3.5">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-200">
                <IconClock className="h-4 w-4 text-brand-500" /> تسجيل قراءة جديدة
              </p>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">انقباضي</span>
                  <input
                    className="field num"
                    inputMode="numeric"
                    placeholder="145"
                    value={form.systolic}
                    onChange={(event) => setForm({ ...form, systolic: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">انبساطي</span>
                  <input
                    className="field num"
                    inputMode="numeric"
                    placeholder="85"
                    value={form.diastolic}
                    onChange={(event) => setForm({ ...form, diastolic: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">النبض</span>
                  <input
                    className="field num"
                    inputMode="numeric"
                    placeholder="82"
                    value={form.pulse}
                    onChange={(event) => setForm({ ...form, pulse: event.target.value })}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                  إجمالي UF المسحوب حتى الآن (مل)
                </span>
                <input
                  className="field num"
                  inputMode="numeric"
                  placeholder="1305"
                  value={form.ufRemovedMl}
                  onChange={(event) => setForm({ ...form, ufRemovedMl: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">ملاحظة (اختياري)</span>
                <input
                  className="field"
                  placeholder="حالة المريض، شكوى، إجراء..."
                  value={form.note}
                  onChange={(event) => setForm({ ...form, note: event.target.value })}
                />
              </label>
              {error && <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
              <button type="submit" className="btn w-full bg-brand-600 text-white hover:bg-brand-700">
                حفظ القراءة
              </button>
            </form>
          )}

          <div className="card-surface p-3.5">
            <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">سجل القراءات ({session.vitals.length})</p>
            <ol className="mt-2 space-y-2">
              {readings.map((vital) => (
                <li
                  key={vital.id}
                  className="flex items-start justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-800/50"
                >
                  <div className="min-w-0">
                    <p className="num text-[12px] font-bold text-slate-700 dark:text-slate-200">
                      {formatClock(vital.at)} · {vital.systolic}/{vital.diastolic} · نبض {vital.pulse}
                    </p>
                    <p className="truncate text-[10.5px] text-slate-400 dark:text-slate-500">
                      UF {vital.ufRemovedMl} مل{vital.note ? ` — ${vital.note}` : ''}
                    </p>
                  </div>
                  <span className="num shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                    {Math.round((vital.ufRemovedMl / Math.max(1, session.ufGoalMl)) * 100)}%
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {session.notes && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-[11.5px] leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              <span className="font-bold text-slate-700 dark:text-slate-200">ملاحظات: </span>
              {session.notes}
            </div>
          )}
        </div>

        <footer className="sticky bottom-0 flex gap-2 border-t border-slate-200 bg-white/95 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          {isActive ? (
            <button
              type="button"
              onClick={() => onEndSession(slot.id)}
              className="btn flex-1 bg-brand-600 text-white hover:bg-brand-700"
            >
              <IconCheck className="h-4 w-4" />
              إنهاء الجلسة
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onDischarge(slot.id)}
              className="btn flex-1 bg-amber-600 text-white hover:bg-amber-700"
            >
              إخلاء السرير
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            إغلاق
          </button>
        </footer>
      </section>
    </div>
  );
}
