import type { Slot } from '../types';
import { formatClock, minutesSince, ufPercent } from './utils';

const HEADERS = [
  'السرير',
  'الماكينة',
  'المريض',
  'رقم الملف',
  'السن',
  'الوصول الوعائي',
  'الوزن الجاف (كجم)',
  'الوزن الحالي (كجم)',
  'UF المطلوب (مل)',
  'UF المسحوب (مل)',
  'نسبة UF',
  'Qb (مل/دقيقة)',
  'الضغط',
  'النبض',
  'الحالة',
  'بداية الجلسة',
  'نهاية الجلسة',
  'مدة الجلسة (دقيقة)',
];

const STATUS_AR: Record<string, string> = {
  active: 'قيد الغسيل',
  completed: 'مكتمل',
};

function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function boardToCsv(slots: Slot[], now: number): string {
  const rows: string[] = [HEADERS.map(cell).join(',')];

  for (const slot of slots) {
    const s = slot.session;
    if (!s) continue;
    const ended = s.endedAt ?? '';
    const duration =
      ended || s.status === 'completed'
        ? Math.round(minutesSince(s.startedAt, ended ? new Date(ended).getTime() : now))
        : Math.round(minutesSince(s.startedAt, now));

    rows.push(
      [
        slot.id,
        slot.machine,
        s.patient.name,
        s.patient.fileNo,
        s.patient.age,
        s.access,
        s.dryWeight,
        s.preWeight,
        s.ufGoalMl,
        s.ufRemovedMl,
        `${ufPercent(s.ufRemovedMl, s.ufGoalMl)}%`,
        s.qb,
        `${s.systolic}/${s.diastolic}`,
        s.pulse,
        STATUS_AR[s.status],
        formatClock(s.startedAt),
        ended ? formatClock(ended) : '',
        duration,
      ]
        .map(cell)
        .join(','),
    );
  }

  return rows.join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
