import { ROLE_LABELS, type AuthUser } from '../types';
import { arabicDate, formatClock, shiftLabel } from '../lib/utils';
import { IconActivity, IconDownload, IconLock, IconLogout, IconMoon, IconPlus, IconSun } from './icons';

interface Props {
  now: number;
  dark: boolean;
  user: AuthUser;
  lastSync: number | null;
  onToggleDark: () => void;
  onNewSession: () => void;
  onExport: () => void;
  exportDisabled: boolean;
  onLogout: () => void;
  onChangePassword: () => void;
}

export default function DashboardHeader({
  now,
  dark,
  user,
  lastSync,
  onToggleDark,
  onNewSession,
  onExport,
  exportDisabled,
  onLogout,
  onChangePassword,
}: Props) {
  const syncLabel = lastSync ? formatClock(new Date(lastSync).toISOString()) : '—';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-lg shadow-brand-900/25">
            <IconActivity className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              Dr Roby Clinic — Clinical EMR
            </p>
            <h1 className="text-[15px] font-extrabold leading-tight text-slate-900 sm:text-lg dark:text-slate-50">
              وحدة الغسيل الكلوي التخصصية
            </h1>
            <p className="mt-0.5 hidden items-center gap-1 text-[10.5px] text-slate-400 sm:flex dark:text-slate-500">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              مزامنة مباشرة · آخر تحديث <span className="num font-semibold">{syncLabel}</span>
            </p>
          </div>
        </div>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-600 lg:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {arabicDate(now)}
          </span>
          <span className="hidden items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-600 sm:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {shiftLabel(now)}
          </span>
          <span className="num hidden rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-extrabold text-slate-800 md:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {formatClock(new Date(now).toISOString())}
          </span>

          <button
            type="button"
            onClick={onToggleDark}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={dark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            title={dark ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {dark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="btn border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <IconDownload className="h-4 w-4" />
            <span className="hidden sm:inline">تصدير كشف المرضى</span>
            <span className="sm:hidden">CSV</span>
          </button>

          <button
            type="button"
            onClick={onNewSession}
            className="btn bg-brand-600 text-white shadow-md shadow-brand-900/25 transition hover:bg-brand-700"
          >
            <IconPlus className="h-4 w-4" />
            بدء جلسة جديدة
          </button>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white py-1 pe-1 ps-1.5 dark:border-slate-700 dark:bg-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-[11px] font-extrabold text-white">
              {user.name.replace(/^د\.\s*/, '').charAt(0)}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="max-w-[110px] truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">
                {user.name}
              </p>
              <p className="text-[9.5px] text-slate-400 dark:text-slate-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={onChangePassword}
              title="تغيير كلمة المرور"
              aria-label="تغيير كلمة المرور"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <IconLock className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              <IconLogout className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
