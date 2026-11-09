import type { DatabaseSync } from 'node:sqlite';

const MODELS = [
  'Fresenius 5008 CorDiax',
  'Fresenius 4008S',
  'B.Braun Dialog+',
  'Nipro Surdial X',
  'Fresenius 5008 CorDiax',
];

const ago = (now: number, minutes: number) => new Date(now - minutes * 60000).toISOString();

interface DemoVital {
  minutesAgo: number;
  systolic: number;
  diastolic: number;
  pulse: number;
  uf: number;
  note?: string;
}

interface DemoSession {
  slotId: number;
  status: 'active' | 'completed';
  name: string;
  fileNo: string;
  age: number;
  access: string;
  dryWeight: number;
  preWeight: number;
  ufGoalMl: number;
  ufRemovedMl: number;
  qb: number;
  durationMin: number;
  startedMinAgo: number;
  endedMinAgo?: number;
  systolic: number;
  diastolic: number;
  pulse: number;
  notes: string;
  vitals: DemoVital[];
}

function demoSession(
  slotId: number,
  name: string,
  fileNo: string,
  age: number,
  access: string,
  dryWeight: number,
  preWeight: number,
  ufGoalMl: number,
  qb: number,
  durationMin: number,
  startedMinAgo: number,
  systolic: number,
  diastolic: number,
  pulse: number,
): DemoSession {
  const ufNow = Math.round(ufGoalMl * (startedMinAgo / durationMin));
  return {
    slotId,
    status: 'active',
    name,
    fileNo,
    age,
    access,
    dryWeight,
    preWeight,
    ufGoalMl,
    ufRemovedMl: Math.min(ufGoalMl, ufNow),
    qb,
    durationMin,
    startedMinAgo,
    systolic,
    diastolic,
    pulse,
    notes: 'تحمّل جيد للجلسة، لا شكوى من الدوار.',
    vitals: [
      {
        minutesAgo: startedMinAgo,
        systolic: systolic + 6,
        diastolic: diastolic + 5,
        pulse: pulse + 6,
        uf: 0,
        note: 'قياسات ما قبل الجلسة',
      },
      {
        minutesAgo: Math.max(5, startedMinAgo - 60),
        systolic: systolic + 2,
        diastolic: diastolic + 2,
        pulse: pulse + 2,
        uf: Math.round(Math.min(ufGoalMl, ufNow) * 0.5),
      },
      {
        minutesAgo: 6,
        systolic,
        diastolic,
        pulse,
        uf: Math.min(ufGoalMl, ufNow),
        note: 'متابعة دورية — حالة مستقرة',
      },
    ],
  };
}

function completedSession(
  slotId: number,
  name: string,
  fileNo: string,
  age: number,
  access: string,
  dryWeight: number,
  preWeight: number,
  ufGoalMl: number,
  qb: number,
  durationMin: number,
  endedMinAgo: number,
  systolic: number,
  diastolic: number,
  pulse: number,
): DemoSession {
  const startedMinAgo = endedMinAgo + durationMin + 12;
  return {
    slotId,
    status: 'completed',
    name,
    fileNo,
    age,
    access,
    dryWeight,
    preWeight,
    ufGoalMl,
    ufRemovedMl: ufGoalMl,
    qb,
    durationMin,
    startedMinAgo,
    endedMinAgo,
    systolic,
    diastolic,
    pulse,
    notes: 'تم إيقاف الجلسة في وقتها، الوزن بعد الغسيل مطابق للوزن الجاف.',
    vitals: [
      {
        minutesAgo: startedMinAgo,
        systolic: systolic + 10,
        diastolic: diastolic + 8,
        pulse: pulse + 8,
        uf: 0,
        note: 'قياسات ما قبل الجلسة',
      },
      {
        minutesAgo: endedMinAgo + Math.round(durationMin / 2),
        systolic: systolic + 3,
        diastolic: diastolic + 3,
        pulse: pulse + 3,
        uf: Math.round(ufGoalMl * 0.55),
      },
      {
        minutesAgo: endedMinAgo,
        systolic,
        diastolic,
        pulse,
        uf: ufGoalMl,
        note: 'نهاية الجلسة — وزن ما بعد الغسيل',
      },
    ],
  };
}

function demoBoard(): DemoSession[] {
  return [
    demoSession(1, 'أحمد سمير عبد الله', '1041', 62, 'AV FISTULA RIGHT BRACHIO — CPN-1001', 68.5, 74.2, 2800, 320, 240, 96, 130, 80, 78),
    demoSession(3, 'خالد إبراهيم مصطفى', '1042', 58, 'AV FISTULA LEFT BRACHIO — CPN-1003', 70, 81.6, 2900, 360, 240, 132, 145, 85, 82),
    completedSession(5, 'سعيد فتحي محمود', '1038', 66, 'AV GRAFT RIGHT FEMORAL — CPN-0994', 72.5, 79.8, 2500, 300, 240, 70, 120, 75, 74),
    demoSession(7, 'نهى عبد الرحمن سالم', '1029', 44, 'AV FISTULA LEFT RADIO — CPN-1032', 56, 60.4, 1800, 300, 240, 54, 118, 72, 88),
    completedSession(9, 'محمد إبراهيم الشبراوي', '1033', 71, 'PERMICATH JUGULAR — CPN-1002', 61.5, 68.2, 2214, 280, 240, 140, 135, 78, 80),
    demoSession(10, 'منال عبد الفتاح حسن', '1045', 39, 'AV FISTULA LEFT BRACHIO — CPN-1005', 58.5, 63.1, 1900, 280, 210, 22, 110, 70, 76),
    demoSession(12, 'يوسف كامل عبد العزيز', '1019', 52, 'AV FISTULA RIGHT BRACHIO — CPN-1004', 74, 78.2, 2600, 340, 240, 158, 138, 86, 84),
  ];
}

export function seedDemoData(db: DatabaseSync, now = Date.now()): void {
  const insertSession = db.prepare(`
    INSERT INTO dialysis_sessions (
      id, slot_id, status, patient_name, patient_file_no, patient_age, access,
      dry_weight, pre_weight, uf_goal_ml, uf_removed_ml, qb, duration_min,
      started_at, ended_at, systolic, diastolic, pulse, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertVital = db.prepare(`
    INSERT INTO vitals (id, session_id, recorded_at, systolic, diastolic, pulse, uf_removed_ml, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const demo of demoBoard()) {
    const sessionId = `demo-${demo.slotId}-${now}`;
    const startedAt = ago(now, demo.startedMinAgo);
    insertSession.run(
      sessionId,
      demo.slotId,
      demo.status,
      demo.name,
      demo.fileNo,
      demo.age,
      demo.access,
      demo.dryWeight,
      demo.preWeight,
      demo.ufGoalMl,
      demo.ufRemovedMl,
      demo.qb,
      demo.durationMin,
      startedAt,
      demo.endedMinAgo === undefined ? null : ago(now, demo.endedMinAgo),
      demo.systolic,
      demo.diastolic,
      demo.pulse,
      demo.notes,
    );

    demo.vitals.forEach((vital, index) => {
      insertVital.run(
        `${sessionId}-v${index}`,
        sessionId,
        ago(now, vital.minutesAgo),
        vital.systolic,
        vital.diastolic,
        vital.pulse,
        vital.uf,
        vital.note ?? null,
      );
    });
  }
}

export const SLOT_MODELS = MODELS;
