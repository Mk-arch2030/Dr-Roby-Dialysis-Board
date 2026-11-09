import { useState } from 'react';
import { ApiError } from '../lib/api';
import { IconActivity, IconDroplet, IconHeart } from './icons';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
}


export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('أدخل اسم المستخدم وكلمة المرور.');
      return;
    }
    setBusy(true);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تسجيل الدخول — حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -start-16 bottom-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <IconActivity className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/50">Dr Roby Clinic</p>
              <p className="text-sm font-extrabold">Clinical EMR · نظام إدارة الوحدة</p>
            </div>
          </div>

          <h1 className="mt-12 max-w-sm text-3xl font-extrabold leading-snug">
            وحدة الغسيل الكلوي
            <span className="mt-1 block text-brand-300">بورد موحّد لكل الفريق</span>
          </h1>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/70">
            بيانات الجلسات، الأوزان، سحب السوائل والقراءات الحيوية محفوظة في قاعدة بيانات الوحدة، وأي تحديث
            يظهر لكل الأجهزة المسجّلة خلال ثوانٍ.
          </p>

          <ul className="mt-8 space-y-3 text-[12.5px] text-white/80">
            {[
              ['جلسات وأسرّة لحظية', <IconDroplet key="d" className="h-4 w-4" />],
              ['سجل قراءات لا يضيع', <IconActivity key="a" className="h-4 w-4" />],
              ['صلاحيات منفصلة للطبيب والتمريض', <IconHeart key="h" className="h-4 w-4" />],
            ].map(([label, icon]) => (
              <li key={String(label)} className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-brand-200">{icon}</span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[10.5px] leading-relaxed text-white/40">
          بيانات المرضى في هذه النسخة تجريبية. عند التشغيل الفعلي، استخدم بيانات مرضى حقيقية فقط بعد تأمين
          السيرفر والنسخ الاحتياطي.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white">
              <IconActivity className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-500">Dr Roby Clinic</p>
            <h1 className="text-xl font-extrabold text-white">وحدة الغسيل الكلوي</h1>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl lg:mt-0">
            <h2 className="text-[17px] font-extrabold text-white">تسجيل دخول الفريق الطبي</h2>
            <p className="mt-1 text-[11.5px] text-slate-400">
              استخدم الحساب الذي أنشأه مسؤول الوحدة. كل الإجراءات تُسجَّل باسم المستخدم.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-300">اسم المستخدم</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="field border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-600"
                  placeholder="dr.roby"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-slate-300">كلمة المرور</span>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={visible ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="field border-slate-700 bg-slate-950 pe-16 text-slate-100 placeholder:text-slate-600"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((value) => !value)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold text-brand-300 hover:bg-white/5"
                  >
                    {visible ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              </label>

              {error && (
                <p className="rounded-xl bg-rose-950/60 px-3 py-2 text-[11.5px] font-semibold text-rose-300 ring-1 ring-rose-900">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn w-full bg-brand-600 text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
              </button>
            </form>

          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            متصل بقاعدة بيانات الوحدة المركزية
          </p>
        </div>
      </main>
    </div>
  );
}
