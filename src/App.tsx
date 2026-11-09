import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthUser, FilterKey, Patient, Slot, SlotCounts, Vital } from './types';
import { ApiError, api, loadStoredToken, setAuthToken } from './lib/api';
import { boardToCsv, downloadCsv } from './lib/csv';
import { ufPercent } from './lib/utils';
import DashboardHeader from './components/DashboardHeader';
import StatsRow from './components/StatsRow';
import FilterTabs from './components/FilterTabs';
import SlotCard from './components/SlotCard';
import SessionPanel from './components/SessionPanel';
import StartSessionDialog, { type SessionDraft } from './components/StartSessionDialog';
import LoginScreen from './components/LoginScreen';
import PasswordDialog from './components/PasswordDialog';
import { IconActivity, IconRefresh, IconSearch } from './components/icons';

const THEME_KEY = 'dr-roby-theme';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

const messageOf = (error: unknown) =>
  error instanceof ApiError ? error.message : 'حدث خطأ غير متوقع — حاول مرة أخرى.';

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-brand-600 text-white">
          <IconActivity className="h-6 w-6" />
        </span>
        <p className="mt-3 text-[12px] font-semibold text-slate-400">جارٍ الاتصال بقاعدة بيانات الوحدة...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [now, setNow] = useState<number>(() => Date.now());
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncError, setSyncError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [startSlotId, setStartSlotId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const notify = useCallback((text: string) => setToast({ id: Date.now(), text }), []);

  const sessionExpired = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setSlots([]);
    setSelectedId(null);
    setStartSlotId(null);
    setToast({ id: Date.now(), text: 'انتهت صلاحية الدخول — يرجى تسجيل الدخول من جديد.' });
  }, []);

  const loadBoard = useCallback(
    async (silent = false) => {
      try {
        const data = await api.board();
        setSlots(data.slots);
        setLastSync(Date.now());
        setSyncError('');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          sessionExpired();
          return;
        }
        if (!silent) setSyncError(messageOf(error));
      }
    },
    [sessionExpired],
  );

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        sessionExpired();
        return;
      }
      notify(messageOf(error));
    },
    [notify, sessionExpired],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    let alive = true;
    const token = loadStoredToken();
    if (!token) {
      setBooting(false);
      return;
    }
    void (async () => {
      try {
        const me = await api.me();
        const data = await api.board();
        if (!alive) return;
        setUser(me.user);
        setSlots(data.slots);
        setLastSync(Date.now());
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setAuthToken(null);
        } else if (alive) {
          notify(messageOf(error));
        }
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [notify]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => void loadBoard(true), 7000);
    const onFocus = () => void loadBoard(true);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, loadBoard]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const counts: SlotCounts = useMemo(
    () => ({
      total: slots.length,
      active: slots.filter((slot) => slot.session?.status === 'active').length,
      completed: slots.filter((slot) => slot.session?.status === 'completed').length,
      available: slots.filter((slot) => !slot.session).length,
    }),
    [slots],
  );

  const avgUf = useMemo(() => {
    const active = slots.filter((slot) => slot.session?.status === 'active');
    if (!active.length) return 0;
    const total = active.reduce(
      (sum, slot) => sum + ufPercent(slot.session!.ufRemovedMl, slot.session!.ufGoalMl),
      0,
    );
    return Math.round(total / active.length);
  }, [slots]);

  const visibleSlots = useMemo(() => {
    const needle = normalize(query);
    return slots.filter((slot) => {
      const session = slot.session;
      const matchesFilter = filter === 'all' || (filter === 'available' ? !session : session?.status === filter);
      if (!matchesFilter) return false;
      if (!needle) return true;
      if (!session) return normalize(`${slot.machine} ${slot.id}`).includes(needle);
      return normalize(
        `${session.patient.name} ${session.patient.fileNo} ${session.access} ${slot.machine}`,
      ).includes(needle);
    });
  }, [slots, filter, query]);

  const selectedSlot = selectedId === null ? null : slots.find((slot) => slot.id === selectedId) ?? null;
  const startSlot = startSlotId === null ? null : slots.find((slot) => slot.id === startSlotId) ?? null;

  const handleLogin = async (username: string, password: string) => {
    const result = await api.login(username, password);
    setAuthToken(result.token);
    setUser(result.user);
    setSyncError('');
    await loadBoard();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      /* الخروج محليًا حتى لو فشل الاتصال */
    }
    setAuthToken(null);
    setUser(null);
    setSlots([]);
    setLastSync(null);
    setSelectedId(null);
    setStartSlotId(null);
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    const result = await api.changePassword(currentPassword, newPassword);
    setAuthToken(result.token);
    setPasswordOpen(false);
    notify('تم تغيير كلمة المرور بنجاح');
  };

  const handleStartSession = async (slotId: number, draft: SessionDraft) => {
    const patient: Patient = draft.patient;
    try {
      await api.startSession({
        slotId,
        patient,
        access: draft.access,
        dryWeight: draft.dryWeight,
        preWeight: draft.preWeight,
        ufGoalMl: draft.ufGoalMl,
        qb: draft.qb,
        durationMin: draft.durationMin,
      });
      setStartSlotId(null);
      await loadBoard(true);
      setSelectedId(slotId);
      notify(`تم بدء جلسة للمريض ${patient.name} على سرير #${String(slotId).padStart(2, '0')}`);
    } catch (error) {
      handleError(error);
    }
  };

  const sessionOf = (slotId: number) => slots.find((slot) => slot.id === slotId)?.session ?? null;

  const handleAddVital = async (slotId: number, vital: Omit<Vital, 'id' | 'at'>) => {
    const session = sessionOf(slotId);
    if (!session) return;
    try {
      await api.addVital(session.id, vital);
      await loadBoard(true);
      notify('تم حفظ القراءة الحيوية');
    } catch (error) {
      handleError(error);
    }
  };

  const handleEndSession = async (slotId: number) => {
    const session = sessionOf(slotId);
    if (!session) return;
    try {
      await api.endSession(session.id);
      await loadBoard(true);
      notify('تم إنهاء الجلسة وتسجيلها في السجل');
    } catch (error) {
      handleError(error);
    }
  };

  const handleDischarge = async (slotId: number) => {
    const session = sessionOf(slotId);
    if (!session) return;
    try {
      await api.discharge(session.id);
      setSelectedId(null);
      await loadBoard(true);
      notify(`السرير #${String(slotId).padStart(2, '0')} أصبح متاحًا`);
    } catch (error) {
      handleError(error);
    }
  };

  const handleExport = () => {
    const csv = boardToCsv(slots, now);
    const stamp = new Date(now).toISOString().slice(0, 10);
    downloadCsv(`dialysis-board-${stamp}.csv`, csv);
    notify('تم تصدير كشف المرضى بصيغة CSV');
  };

  const handleReset = async () => {
    if (!window.confirm('سيتم حذف كل الجلسات الحالية واستبدالها ببيانات عرض تجريبية. هل تريد المتابعة؟')) {
      return;
    }
    try {
      await api.resetDemo();
      setSelectedId(null);
      setQuery('');
      setFilter('all');
      await loadBoard(true);
      notify('تم تصفير البيانات وإعادة تحميل بيانات العرض');
    } catch (error) {
      handleError(error);
    }
  };

  const openNewSession = () => {
    const free = slots.find((slot) => !slot.session);
    if (!free) {
      notify('لا يوجد سرير متاح — أخلِ سريرًا أولًا');
      return;
    }
    setStartSlotId(free.id);
  };

  const toastNode = toast ? (
    <div
      key={toast.id}
      className="animate-rise fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-[12px] font-bold text-white shadow-xl dark:bg-white dark:text-slate-900"
      role="status"
    >
      {toast.text}
    </div>
  ) : null;

  if (booting) return <Splash />;
  if (!user)
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        {toastNode}
      </>
    );

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0b1416]">
      <DashboardHeader
        now={now}
        dark={dark}
        user={user}
        lastSync={lastSync}
        onToggleDark={() => setDark((value) => !value)}
        onNewSession={openNewSession}
        onExport={handleExport}
        exportDisabled={counts.active + counts.completed === 0}
        onLogout={handleLogout}
        onChangePassword={() => setPasswordOpen(true)}
      />

      <main className="mx-auto max-w-[1500px] space-y-4 px-4 py-5">
        {syncError && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <span>{syncError}</span>
            <button
              type="button"
              onClick={() => void loadBoard()}
              className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-rose-700 shadow-sm dark:bg-rose-900/40 dark:text-rose-200"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        <StatsRow counts={counts} avgUf={avgUf} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterTabs value={filter} counts={counts} onChange={setFilter} />

          <div className="relative w-full sm:w-80">
            <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم أو رقم الملف أو الماكينة..."
              className="field ps-9"
              aria-label="بحث في الأسرّة"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-slate-500 dark:text-slate-400">
          <p>
            عرض <span className="num font-bold text-slate-700 dark:text-slate-200">{visibleSlots.length}</span> من{' '}
            <span className="num">{slots.length}</span> سرير
            {query && <span className="ms-1">· نتائج البحث عن «{query}»</span>}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void loadBoard()}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <IconRefresh className="h-3.5 w-3.5" />
              تحديث الآن
            </button>
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg px-2 py-1 font-semibold text-amber-600 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
              >
                تصفير بيانات العرض
              </button>
            )}
          </div>
        </div>

        {visibleSlots.length === 0 ? (
          <div className="card-surface grid place-items-center gap-2 px-4 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <IconSearch className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">لا توجد نتائج مطابقة</p>
            <p className="text-[11.5px] text-slate-400">جرّب تغيير الفلتر أو مسح كلمة البحث.</p>
          </div>
        ) : (
          <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                now={now}
                onOpen={() => setSelectedId(slot.id)}
                onStart={() => setStartSlotId(slot.id)}
                onDischarge={() => void handleDischarge(slot.id)}
              />
            ))}
          </section>
        )}

        <footer className="pt-2 pb-6 text-center text-[10.5px] leading-relaxed text-slate-400 dark:text-slate-600">
          Dr Roby Clinic — وحدة الغسيل الكلوي · البيانات محفوظة في قاعدة بيانات الوحدة المركزية، وكل إجراء مسجّل
          باسم المستخدم.
        </footer>
      </main>

      {selectedSlot && selectedSlot.session && (
        <SessionPanel
          slot={selectedSlot}
          now={now}
          onClose={() => setSelectedId(null)}
          onAddVital={(slotId, vital) => void handleAddVital(slotId, vital)}
          onEndSession={(slotId) => void handleEndSession(slotId)}
          onDischarge={(slotId) => void handleDischarge(slotId)}
        />
      )}

      {startSlot && (
        <StartSessionDialog slot={startSlot} onClose={() => setStartSlotId(null)} onSubmit={handleStartSession} />
      )}

      {passwordOpen && (
        <PasswordDialog onClose={() => setPasswordOpen(false)} onSubmit={handleChangePassword} />
      )}

      {toastNode}
    </div>
  );
}
