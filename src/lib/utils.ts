export const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

export function minutesSince(iso: string, now: number): number {
  return Math.max(0, (now - new Date(iso).getTime()) / 60000);
}

export function formatHM(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function arabicDate(now: number): string {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(now));
}

export function ufPercent(removed: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((removed / goal) * 100));
}

export function shiftLabel(now: number): string {
  const h = new Date(now).getHours();
  if (h < 8) return 'الوردية الليلية';
  if (h < 14) return 'الوردية الصباحية';
  return 'الوردية المسائية';
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function remainingMinutes(startedAt: string, durationMin: number, now: number): number {
  return Math.max(0, durationMin - minutesSince(startedAt, now));
}

export function oneDecimal(n: number): string {
  return Number.isFinite(n) ? n.toFixed(1) : '—';
}
