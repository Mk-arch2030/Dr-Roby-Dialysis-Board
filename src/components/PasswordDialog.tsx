import { useState } from 'react';
import { ApiError } from '../lib/api';
import { IconClose } from './icons';

interface Props {
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}

export default function PasswordDialog({ onClose, onSubmit }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
      setError('كلمة المرور الجديدة ٨ أحرف على الأقل وتحتوي حروفًا وأرقامًا.');
      return;
    }
    if (next !== confirm) {
      setError('تأكيد كلمة المرور لا يطابق كلمة المرور الجديدة.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(current, next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تغيير كلمة المرور.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={submit}
        className="animate-rise relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-slate-50">تغيير كلمة المرور</h2>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              بعد التغيير تُسجَّل خروج كل الأجهزة الأخرى المسجّلة بحسابك.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">كلمة المرور الحالية</span>
            <input
              type="password"
              className="field"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              autoComplete="current-password"
              dir="ltr"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">كلمة المرور الجديدة</span>
            <input
              type="password"
              className="field"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              autoComplete="new-password"
              dir="ltr"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">تأكيد كلمة المرور</span>
            <input
              type="password"
              className="field"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              dir="ltr"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={busy} className="btn flex-1 bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
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
