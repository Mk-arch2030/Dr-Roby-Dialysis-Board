import { useState } from 'react';
import type { Patient, Slot } from '../types';
import { ACCESS_OPTIONS, SESSION_DURATIONS } from '../data/seed';
import { IconClose, IconDroplet } from './icons';

export interface SessionDraft {
  patient: Patient;
  access: string;
  dryWeight: number;
  preWeight: number;
  ufGoalMl: number;
  qb: number;
  durationMin: number;
}

interface Props {
  slot: Slot;
  onClose: () => void;
  onSubmit: (slotId: number, draft: SessionDraft) => void;
}

export default function StartSessionDialog({ slot, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [fileNo, setFileNo] = useState('');
  const [age, setAge] = useState('');
  const [access, setAccess] = useState(ACCESS_OPTIONS[0]);
  const [dryWeight, setDryWeight] = useState('');
  const [preWeight, setPreWeight] = useState('');
  const [ufGoalMl, setUfGoalMl] = useState('');
  const [ufTouched, setUfTouched] = useState(false);
  const [qb, setQb] = useState('320');
  const [durationMin, setDurationMin] = useState(240);
  const [error, setError] = useState('');

  const suggestUf = (nextDry: string, nextPre: string) => {
    const dry = Number(nextDry);
    const pre = Number(nextPre);
    if (!ufTouched && dry > 0 && pre > dry) {
      setUfGoalMl(String(Math.round((pre - dry) * 1000)));
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const dry = Number(dryWeight);
    const pre = Number(preWeight);
    const ageValue = Number(age);
    const uf = Number(ufGoalMl);
    const qbValue = Number(qb);

    if (!name.trim()) return setError('أدخل اسم المريض.');
    if (!fileNo.trim()) return setError('أدخل رقم الملف الطبي.');
    if (!ageValue || ageValue < 1 || ageValue > 120) return setError('أدخل سنًا صحيحًا (1–120).');
    if (!dry || dry < 20 || dry > 200) return setError('أدخل الوزن الجاف بالكيلوجرام (20–200).');
    if (!pre || pre < 20 || pre > 220) return setError('أدخل وزن المريض قبل الجلسة (20–220).');
    if (pre < dry) return setError('وزن ما قبل الجلسة أقل من الوزن الجاف — راجع القيم.');
    if (!uf || uf <= 0) return setError('أدخل كمية UF المطلوبة بالمللي.');
    if (!qbValue || qbValue < 100 || qbValue > 600) return setError('معدل Qb يجب أن يكون بين 100 و600 مل/دقيقة.');

    onSubmit(slot.id, {
      patient: { name: name.trim(), fileNo: fileNo.trim(), age: ageValue },
      access,
      dryWeight: dry,
      preWeight: pre,
      ufGoalMl: uf,
      qb: qbValue,
      durationMin,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="بدء جلسة جديدة">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={submit}
        className="animate-rise relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              سرير #{String(slot.id).padStart(2, '0')} · {slot.machine}
            </p>
            <h2 className="mt-0.5 flex items-center gap-1.5 text-[16px] font-extrabold text-slate-900 dark:text-slate-50">
              <IconDroplet className="h-4 w-4 text-brand-500" />
              بدء جلسة غسيل كلوي جديدة
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              تُسجَّل الجلسة بوقت البدء الآن وتظهر فورًا على البورد.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">اسم المريض رباعي</span>
            <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="خالد إبراهيم مصطفى" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">رقم الملف</span>
            <input className="field num" value={fileNo} onChange={(event) => setFileNo(event.target.value)} placeholder="1042" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">السن</span>
            <input
              className="field num"
              inputMode="numeric"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              placeholder="58"
            />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">الوصول الوعائي</span>
            <select className="field" value={access} onChange={(event) => setAccess(event.target.value)}>
              {ACCESS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">الوزن الجاف (كجم)</span>
            <input
              className="field num"
              inputMode="decimal"
              value={dryWeight}
              onChange={(event) => {
                setDryWeight(event.target.value);
                suggestUf(event.target.value, preWeight);
              }}
              placeholder="70.0"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">الوزن قبل الجلسة (كجم)</span>
            <input
              className="field num"
              inputMode="decimal"
              value={preWeight}
              onChange={(event) => {
                setPreWeight(event.target.value);
                suggestUf(dryWeight, event.target.value);
              }}
              placeholder="81.6"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">UF المطلوب (مل)</span>
            <input
              className="field num"
              inputMode="numeric"
              value={ufGoalMl}
              onChange={(event) => {
                setUfTouched(true);
                setUfGoalMl(event.target.value);
              }}
              placeholder="2900"
            />
            <span className="mt-1 block text-[10px] text-slate-400">يُحسب تلقائيًا: (الوزن قبل − الجاف) × 1000</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">معدل Qb (مل/دقيقة)</span>
            <input
              className="field num"
              inputMode="numeric"
              value={qb}
              onChange={(event) => setQb(event.target.value)}
              placeholder="320"
            />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">مدة الجلسة</span>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_DURATIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDurationMin(minutes)}
                  className={`num rounded-xl border px-3 py-1.5 text-[12px] font-bold transition ${
                    durationMin === minutes
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {minutes} دقيقة
                </button>
              ))}
            </div>
          </label>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11.5px] font-semibold text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button type="submit" className="btn flex-1 bg-brand-600 text-white hover:bg-brand-700">
            بدء الجلسة
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
