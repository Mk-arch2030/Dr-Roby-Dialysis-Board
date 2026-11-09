import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type { AuthUser, Role, Session, Slot, Vital } from '../src/types';
import { hashPassword } from './passwords';
import { dbFile, ensureDataDir } from './runtime';
import { seedDemoData, SLOT_MODELS } from './seed';

ensureDataDir();

export const db = new DatabaseSync(dbFile);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'nurse', 'admin')),
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY,
    machine TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dialysis_sessions (
    id TEXT PRIMARY KEY,
    slot_id INTEGER NOT NULL REFERENCES slots(id),
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
    patient_name TEXT NOT NULL,
    patient_file_no TEXT NOT NULL,
    patient_age INTEGER NOT NULL,
    access TEXT NOT NULL,
    dry_weight REAL NOT NULL,
    pre_weight REAL NOT NULL,
    uf_goal_ml INTEGER NOT NULL,
    uf_removed_ml INTEGER NOT NULL DEFAULT 0,
    qb INTEGER NOT NULL,
    duration_min INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    systolic INTEGER NOT NULL DEFAULT 0,
    diastolic INTEGER NOT NULL DEFAULT 0,
    pulse INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_slot ON dialysis_sessions (slot_id, status);
  CREATE INDEX IF NOT EXISTS idx_sessions_started ON dialysis_sessions (started_at);

  CREATE TABLE IF NOT EXISTS vitals (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES dialysis_sessions(id) ON DELETE CASCADE,
    recorded_at TEXT NOT NULL,
    systolic INTEGER,
    diastolic INTEGER,
    pulse INTEGER,
    uf_removed_ml INTEGER NOT NULL,
    note TEXT,
    created_by INTEGER REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_vitals_session ON vitals (session_id, recorded_at);

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at TEXT NOT NULL,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity TEXT,
    details TEXT
  );
`);

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const nowIso = () => new Date().toISOString();

/* ---------------------------------------------------------------- users --- */

interface UserRow {
  id: number;
  username: string;
  name: string;
  role: Role;
  password_hash: string;
  password_salt: string;
}

type InitialUser = {
  username: string;
  name: string;
  role: Role;
  password: string;
};

function loadInitialUsers(): InitialUser[] {
  const raw = process.env.RBF_INITIAL_USERS_JSON;
  if (raw === undefined) return [];

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("RBF_INITIAL_USERS_JSON must be an array");
  }

  return parsed.map((entry: unknown): InitialUser => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("Invalid initial user");
    }

    const user = entry as Record<string, unknown>;
    if (
      typeof user.username !== "string" ||
      !user.username.trim() ||
      typeof user.name !== "string" ||
      !user.name.trim() ||
      typeof user.password !== "string" ||
      !user.password ||
      !["admin", "doctor", "nurse"].includes(
        String(user.role)
      )
    ) {
      throw new Error("Invalid initial user fields");
    }

    return user as InitialUser;
  });
}

const DEFAULT_USERS = loadInitialUsers();

function ensureUsers(): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO users (username, name, role, password_hash, password_salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const user of DEFAULT_USERS) {
    const { hash, salt } = hashPassword(user.password);
    insert.run(user.username, user.name, user.role, hash, salt, nowIso());
  }
  console.log('[db] تم إنشاء حسابات الفريق الافتراضية');
}

export function findCredentials(username: string): (UserRow & { passwordHash: string; salt: string }) | null {
  const row = db
    .prepare(
      `SELECT id, username, name, role, password_hash AS passwordHash, password_salt AS salt
       FROM users WHERE username = ? COLLATE NOCASE`,
    )
    .get(username.trim()) as unknown as (UserRow & { passwordHash: string; salt: string }) | undefined;
  return row ?? null;
}

export function publicUser(userId: number): AuthUser | null {
  const row = db
    .prepare('SELECT id, username, name, role FROM users WHERE id = ?')
    .get(userId) as unknown as AuthUser | undefined;
  return row ?? null;
}

export function listUsers(): AuthUser[] {
  return db.prepare('SELECT id, username, name, role FROM users ORDER BY id').all() as unknown as AuthUser[];
}

export function setPassword(userId: number, password: string): void {
  const { hash, salt } = hashPassword(password);
  db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').run(hash, salt, userId);
  db.prepare('DELETE FROM auth_tokens WHERE user_id = ?').run(userId);
}

/* --------------------------------------------------------------- tokens --- */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export function issueToken(userId: number): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  db.prepare('INSERT INTO auth_tokens (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    sha256(token),
    userId,
    nowIso(),
    expiresAt,
  );
  db.prepare('DELETE FROM auth_tokens WHERE expires_at < ?').run(nowIso());
  return { token, expiresAt };
}

export function userForToken(token: string): AuthUser | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.name, u.role, t.expires_at AS expiresAt
       FROM auth_tokens t JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ?`,
    )
    .get(sha256(token)) as unknown as (AuthUser & { expiresAt: string }) | undefined;
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    revokeToken(token);
    return null;
  }
  return { id: row.id, username: row.username, name: row.name, role: row.role };
}

export function revokeToken(token: string): void {
  db.prepare('DELETE FROM auth_tokens WHERE token_hash = ?').run(sha256(token));
}

/* ---------------------------------------------------------------- board --- */

interface SessionRow {
  id: string;
  slot_id: number;
  status: 'active' | 'completed' | 'archived';
  patient_name: string;
  patient_file_no: string;
  patient_age: number;
  access: string;
  dry_weight: number;
  pre_weight: number;
  uf_goal_ml: number;
  uf_removed_ml: number;
  qb: number;
  duration_min: number;
  started_at: string;
  ended_at: string | null;
  systolic: number;
  diastolic: number;
  pulse: number;
  notes: string | null;
}

interface VitalRow {
  id: string;
  session_id: string;
  recorded_at: string;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  uf_removed_ml: number;
  note: string | null;
}

const SESSION_SELECT = `
  SELECT id, slot_id, status, patient_name, patient_file_no, patient_age, access,
         dry_weight, pre_weight, uf_goal_ml, uf_removed_ml, qb, duration_min,
         started_at, ended_at, systolic, diastolic, pulse, notes
  FROM dialysis_sessions
`;

function rowToVital(row: VitalRow): Vital {
  return {
    id: row.id,
    at: row.recorded_at,
    systolic: row.systolic ?? 0,
    diastolic: row.diastolic ?? 0,
    pulse: row.pulse ?? 0,
    ufRemovedMl: row.uf_removed_ml,
    note: row.note ?? undefined,
  };
}

function rowToSession(row: SessionRow, machine: string, vitals: Vital[]): Session {
  return {
    id: row.id,
    status: row.status === 'completed' ? 'completed' : 'active',
    patient: { name: row.patient_name, fileNo: row.patient_file_no, age: row.patient_age },
    access: row.access,
    machine,
    dryWeight: row.dry_weight,
    preWeight: row.pre_weight,
    ufGoalMl: row.uf_goal_ml,
    ufRemovedMl: row.uf_removed_ml,
    qb: row.qb,
    durationMin: row.duration_min,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    vitals,
    notes: row.notes ?? undefined,
  };
}

export function getBoard(): Slot[] {
  const slots = db.prepare('SELECT id, machine FROM slots ORDER BY id').all() as unknown as SlotRecord[];
  const rows = db
    .prepare(`${SESSION_SELECT} WHERE status IN ('active', 'completed') ORDER BY started_at DESC`)
    .all() as unknown as SessionRow[];
  const vitals = db.prepare('SELECT * FROM vitals ORDER BY recorded_at ASC').all() as unknown as VitalRow[];

  const vitalsBySession = new Map<string, Vital[]>();
  for (const vital of vitals) {
    const list = vitalsBySession.get(vital.session_id) ?? [];
    list.push(rowToVital(vital));
    vitalsBySession.set(vital.session_id, list);
  }

  const machineById = new Map(slots.map((slot) => [slot.id, slot.machine]));
  const sessionBySlot = new Map<number, Session>();
  for (const row of rows) {
    if (sessionBySlot.has(row.slot_id)) continue;
    sessionBySlot.set(
      row.slot_id,
      rowToSession(row, machineById.get(row.slot_id) ?? '', vitalsBySession.get(row.id) ?? []),
    );
  }

  return slots.map((slot) => ({
    id: slot.id,
    machine: slot.machine,
    session: sessionBySlot.get(slot.id) ?? null,
  }));
}

interface SlotRecord {
  id: number;
  machine: string;
}

export function getSession(sessionId: string): Session | null {
  const row = db.prepare(`${SESSION_SELECT} WHERE id = ?`).get(sessionId) as unknown as SessionRow | undefined;
  if (!row) return null;
  const slot = db.prepare('SELECT machine FROM slots WHERE id = ?').get(row.slot_id) as unknown as
    | { machine: string }
    | undefined;
  const vitals = db
    .prepare('SELECT * FROM vitals WHERE session_id = ? ORDER BY recorded_at ASC')
    .all(sessionId) as unknown as VitalRow[];
  return rowToSession(row, slot?.machine ?? '', vitals.map(rowToVital));
}

export function getSessionSlotId(sessionId: string): number | null {
  const row = db.prepare('SELECT slot_id AS slotId FROM dialysis_sessions WHERE id = ?').get(sessionId) as unknown as
    | { slotId: number }
    | undefined;
  return row?.slotId ?? null;
}

export interface NewSessionInput {
  slotId: number;
  patient: { name: string; fileNo: string; age: number };
  access: string;
  dryWeight: number;
  preWeight: number;
  ufGoalMl: number;
  qb: number;
  durationMin: number;
}

export function createSession(input: NewSessionInput, userId: number): Session {
  const slot = db.prepare('SELECT id FROM slots WHERE id = ?').get(input.slotId) as unknown as
    | { id: number }
    | undefined;
  if (!slot) throw new HttpError(404, 'السرير غير موجود.');

  const occupied = db
    .prepare(`SELECT id FROM dialysis_sessions WHERE slot_id = ? AND status IN ('active', 'completed')`)
    .get(input.slotId) as unknown as { id: string } | undefined;
  if (occupied) throw new HttpError(409, 'هذا السرير مشغول بالفعل — حدّث البورد وأعد المحاولة.');

  const id = randomUUID();
  db.prepare(
    `INSERT INTO dialysis_sessions (
      id, slot_id, status, patient_name, patient_file_no, patient_age, access,
      dry_weight, pre_weight, uf_goal_ml, uf_removed_ml, qb, duration_min, started_at, created_by
    ) VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
  ).run(
    id,
    input.slotId,
    input.patient.name,
    input.patient.fileNo,
    input.patient.age,
    input.access,
    input.dryWeight,
    input.preWeight,
    input.ufGoalMl,
    input.qb,
    input.durationMin,
    nowIso(),
    userId,
  );

  audit(userId, 'session.start', `slot:${input.slotId}`, input.patient.name);

  const session = getSession(id);
  if (!session) throw new HttpError(500, 'تعذّر إنشاء الجلسة.');
  return session;
}

export interface VitalInput {
  systolic: number;
  diastolic: number;
  pulse: number;
  ufRemovedMl: number;
  note?: string;
}

export function addVital(sessionId: string, input: VitalInput, userId: number): Session {
  const row = db
    .prepare('SELECT status FROM dialysis_sessions WHERE id = ?')
    .get(sessionId) as unknown as { status: string } | undefined;
  if (!row) throw new HttpError(404, 'الجلسة غير موجودة.');
  if (row.status !== 'active') throw new HttpError(409, 'لا يمكن تسجيل قراءة على جلسة منتهية.');

  db.prepare(
    `INSERT INTO vitals (id, session_id, recorded_at, systolic, diastolic, pulse, uf_removed_ml, note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), sessionId, nowIso(), input.systolic, input.diastolic, input.pulse, input.ufRemovedMl, input.note ?? null, userId);

  db.prepare(
    'UPDATE dialysis_sessions SET systolic = ?, diastolic = ?, pulse = ?, uf_removed_ml = ? WHERE id = ?',
  ).run(input.systolic, input.diastolic, input.pulse, input.ufRemovedMl, sessionId);

  audit(userId, 'session.vital', `session:${sessionId}`, JSON.stringify(input));

  const session = getSession(sessionId);
  if (!session) throw new HttpError(500, 'تعذّر تحميل الجلسة.');
  return session;
}

export function endSession(sessionId: string, userId: number): Session {
  const row = db
    .prepare('SELECT status, systolic, diastolic, pulse, uf_removed_ml AS uf FROM dialysis_sessions WHERE id = ?')
    .get(sessionId) as unknown as
    | { status: string; systolic: number; diastolic: number; pulse: number; uf: number }
    | undefined;
  if (!row) throw new HttpError(404, 'الجلسة غير موجودة.');
  if (row.status !== 'active') throw new HttpError(409, 'الجلسة منتهية بالفعل.');

  const endedAt = nowIso();
  db.prepare(`UPDATE dialysis_sessions SET status = 'completed', ended_at = ? WHERE id = ?`).run(endedAt, sessionId);
  db.prepare(
    `INSERT INTO vitals (id, session_id, recorded_at, systolic, diastolic, pulse, uf_removed_ml, note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), sessionId, endedAt, row.systolic, row.diastolic, row.pulse, row.uf, 'نهاية الجلسة', userId);

  audit(userId, 'session.end', `session:${sessionId}`);

  const session = getSession(sessionId);
  if (!session) throw new HttpError(500, 'تعذّر تحميل الجلسة.');
  return session;
}

export function dischargeSession(sessionId: string, userId: number): void {
  const row = db
    .prepare('SELECT status, slot_id AS slotId FROM dialysis_sessions WHERE id = ?')
    .get(sessionId) as unknown as { status: string; slotId: number } | undefined;
  if (!row) throw new HttpError(404, 'الجلسة غير موجودة.');
  if (row.status === 'archived') return;

  db.prepare(`UPDATE dialysis_sessions SET status = 'archived' WHERE id = ?`).run(sessionId);
  audit(userId, 'session.discharge', `slot:${row.slotId}`);
}

export function resetDemoData(userId: number): void {
  db.exec('DELETE FROM vitals; DELETE FROM dialysis_sessions;');
  seedDemoData(db);
  audit(userId, 'admin.reset-demo');
}

export function audit(userId: number | null, action: string, entity?: string, details?: string): void {
  db.prepare('INSERT INTO audit_log (at, user_id, action, entity, details) VALUES (?, ?, ?, ?, ?)').run(
    nowIso(),
    userId,
    action,
    entity ?? null,
    details ?? null,
  );
}

export function startupSeed(): void {
  ensureUsers();

  const slots = db.prepare('SELECT COUNT(*) AS count FROM slots').get() as { count: number };
  if (slots.count === 0) {
    const insert = db.prepare('INSERT INTO slots (id, machine) VALUES (?, ?)');
    for (let i = 0; i < 12; i += 1) {
      insert.run(i + 1, SLOT_MODELS[i % SLOT_MODELS.length]);
    }
  }

  const sessions = db.prepare('SELECT COUNT(*) AS count FROM dialysis_sessions').get() as { count: number };
  if (sessions.count === 0) {
    seedDemoData(db);
    console.log('[db] تم تحميل بيانات العرض التجريبية');
  }
}
