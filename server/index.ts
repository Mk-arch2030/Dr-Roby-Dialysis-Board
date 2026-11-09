import express, { type NextFunction, type Request, type Response } from 'express';
import { exec } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { extname, resolve, sep } from 'node:path';
import type { AuthUser, Role } from '../src/types';
import { assetsDir, dbFile, isPackaged } from './runtime';
import {
  addVital,
  audit,
  createSession,
  dischargeSession,
  endSession,
  findCredentials,
  getBoard,
  HttpError,
  issueToken,
  publicUser,
  resetDemoData,
  revokeToken,
  setPassword,
  startupSeed,
  userForToken,
} from './db';
import { verifyPassword } from './passwords';

const PORT = Number(process.env.PORT ?? 4000);
const CLINICAL_ROLES: Role[] = ['doctor', 'nurse', 'admin'];

startupSeed();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

/* ---------------------------------------------------------------- helpers --- */

function requireAuth(roles?: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const user = token ? userForToken(token) : null;
    if (!user) {
      res.status(401).json({ error: 'انتهت الجلسة أو لم تسجّل الدخول — يرجى تسجيل الدخول.' });
      return;
    }
    if (roles && !roles.includes(user.role)) {
      res.status(403).json({ error: 'لا تملك صلاحية تنفيذ هذا الإجراء.' });
      return;
    }
    res.locals.user = user;
    res.locals.token = token;
    next();
  };
}

const user = (res: Response) => res.locals.user as AuthUser;
const token = (res: Response) => res.locals.token as string;

function text(value: unknown, field: string, max = 160): string {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `الحقل «${field}» مطلوب.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new HttpError(400, `الحقل «${field}» أطول من المسموح.`);
  return trimmed;
}

function number(value: unknown, field: string, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new HttpError(400, `${field} يجب أن يكون بين ${min} و${max}.`);
  }
  return parsed;
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/* ------------------------------------------------------------- login guard --- */

const failedLogins = new Map<string, { count: number; resetAt: number }>();

function guardLogin(key: string) {
  const now = Date.now();
  const entry = failedLogins.get(key);
  if (!entry || entry.resetAt < now) return;
  if (entry.count >= 10) throw new HttpError(429, 'محاولات دخول كثيرة — يرجى المحاولة بعد ٥ دقائق.');
}

function recordFailure(key: string) {
  const now = Date.now();
  const entry = failedLogins.get(key);
  if (!entry || entry.resetAt < now) {
    failedLogins.set(key, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return;
  }
  entry.count += 1;
}

/* -------------------------------------------------------------------- auth --- */

app.post('/api/auth/login', async (req, res) => {
  const username = text(req.body?.username, 'اسم المستخدم', 60);
  const password = text(req.body?.password, 'كلمة المرور', 200);
  const key = `${req.ip ?? 'local'}:${username.toLowerCase()}`;

  guardLogin(key);
  const credentials = findCredentials(username);

  if (!credentials || !verifyPassword(password, credentials.salt, credentials.passwordHash)) {
    recordFailure(key);
    // تأخير بسيط لإبطاء محاولات التخمين
    await sleep(250);
    throw new HttpError(401, 'اسم المستخدم أو كلمة المرور غير صحيحة.');
  }

  failedLogins.delete(key);
  const { token: issued, expiresAt } = issueToken(credentials.id);
  audit(credentials.id, 'auth.login');
  res.json({
    token: issued,
    expiresAt,
    user: publicUser(credentials.id),
  });
});

app.get('/api/auth/me', requireAuth(), (_req, res) => {
  res.json({ user: user(res) });
});

app.post('/api/auth/logout', requireAuth(), (_req, res) => {
  revokeToken(token(res));
  res.json({ ok: true });
});

app.post('/api/auth/password', requireAuth(), async (req, res) => {
  const me = user(res);
  const currentPassword = text(req.body?.currentPassword, 'كلمة المرور الحالية', 200);
  const newPassword = text(req.body?.newPassword, 'كلمة المرور الجديدة', 200);

  if (newPassword.length < 8) throw new HttpError(400, 'كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل.');
  if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw new HttpError(400, 'كلمة المرور الجديدة يجب أن تحتوي حروفًا وأرقامًا.');
  }

  const credentials = findCredentials(me.username);
  if (!credentials || !verifyPassword(currentPassword, credentials.salt, credentials.passwordHash)) {
    await sleep(250);
    throw new HttpError(401, 'كلمة المرور الحالية غير صحيحة.');
  }

  setPassword(me.id, newPassword);
  const { token: issued, expiresAt } = issueToken(me.id);
  audit(me.id, 'auth.password-change');
  res.json({ token: issued, expiresAt });
});

/* ------------------------------------------------------------------- board --- */

app.get('/api/board', requireAuth(), (_req, res) => {
  res.json({ slots: getBoard(), serverTime: new Date().toISOString() });
});

app.post('/api/sessions', requireAuth(CLINICAL_ROLES), (req, res) => {
  const body = req.body ?? {};
  const slotId = number(body.slotId, 'رقم السرير', 1, 12);
  const dryWeight = number(body.dryWeight, 'الوزن الجاف', 20, 200);
  const preWeight = number(body.preWeight, 'الوزن قبل الجلسة', 20, 220);

  if (preWeight < dryWeight) {
    throw new HttpError(400, 'وزن ما قبل الجلسة أقل من الوزن الجاف — راجع القيم.');
  }

  const session = createSession(
    {
      slotId,
      patient: {
        name: text(body.patient?.name, 'اسم المريض', 120),
        fileNo: text(body.patient?.fileNo, 'رقم الملف', 40),
        age: number(body.patient?.age, 'السن', 1, 120),
      },
      access: text(body.access, 'الوصول الوعائي', 120),
      dryWeight,
      preWeight,
      ufGoalMl: number(body.ufGoalMl, 'UF المطلوب', 100, 12000),
      qb: number(body.qb, 'معدل Qb', 100, 600),
      durationMin: number(body.durationMin, 'مدة الجلسة', 60, 480),
    },
    user(res).id,
  );
  res.status(201).json({ session });
});

app.post('/api/sessions/:id/vitals', requireAuth(CLINICAL_ROLES), (req, res) => {
  const body = req.body ?? {};
  const session = addVital(
    String(req.params.id),
    {
      systolic: number(body.systolic, 'الضغط الانقباضي', 50, 260),
      diastolic: number(body.diastolic, 'الضغط الانبساطي', 25, 160),
      pulse: number(body.pulse, 'النبض', 30, 200),
      ufRemovedMl: number(body.ufRemovedMl, 'UF المسحوب', 0, 12000),
      note: typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 300) : undefined,
    },
    user(res).id,
  );
  res.json({ session });
});

app.post('/api/sessions/:id/end', requireAuth(CLINICAL_ROLES), (req, res) => {
  res.json({ session: endSession(String(req.params.id), user(res).id) });
});

app.post('/api/sessions/:id/discharge', requireAuth(CLINICAL_ROLES), (req, res) => {
  dischargeSession(String(req.params.id), user(res).id);
  res.json({ ok: true });
});

app.post('/api/admin/reset-demo', requireAuth(['admin']), (_req, res) => {
  resetDemoData(user(res).id);
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/* --------------------------------------------------------- production build --- */

const indexFile = resolve(assetsDir, 'index.html');

if (existsSync(indexFile)) {
  if (isPackaged) {
    // النسخة المغلّفة تحمل ملفات الواجهة داخل الحزمة، لذا نقرأها مباشرة بدل خدمتها من القرص.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        next();
        return;
      }
      const requested = req.path === '/' ? 'index.html' : decodeURIComponent(req.path).replace(/^\/+/, '');
      const file = resolve(assetsDir, requested);
      if (file.startsWith(assetsDir + sep)) {
        try {
          const body = readFileSync(file);
          res.setHeader('Cache-Control', requested.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
          res.type(extname(file)).send(body);
          return;
        } catch {
          // ملف غير موجود — نكمل إلى index.html (مسارات الواجهة)
        }
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.type('html').send(readFileSync(indexFile));
    });
  } else {
    app.use(express.static(assetsDir, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
      res.sendFile(indexFile);
    });
  }
}

app.use((_req, res) => {
  res.status(404).json({ error: 'المسار غير موجود.' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  const status = (err as { status?: number })?.status;
  if (status === 400) {
    res.status(400).json({ error: 'طلب غير صالح.' });
    return;
  }
  console.error('[api] unhandled', err);
  res.status(500).json({ error: 'حدث خطأ غير متوقع في الخادم.' });
});

function lanAddresses(port: number): string[] {
  const addresses: string[] = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const net of entries ?? []) {
      if (net.family === 'IPv4' && !net.internal) addresses.push(`http://${net.address}:${port}`);
    }
  }
  return addresses;
}

function openBrowser(url: string): void {
  const command =
    process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(command, () => {
    /* لو تعذّر فتح المتصفح، يبقى الرابط مطبوعًا في النافذة */
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  const local = `http://127.0.0.1:${PORT}`;
  console.log(`[api] Dr Roby dialysis API على http://0.0.0.0:${PORT}`);

  if (isPackaged) {
    console.log(`[api] قاعدة البيانات: ${dbFile}`);
    for (const url of lanAddresses(PORT)) console.log(`[api] أجهزة الوحدة تفتح البورد من: ${url}`);
    if (process.env.NO_OPEN !== '1') openBrowser(local);
  }
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n✖ المنفذ ${PORT} مشغول — في نسخة أخرى من البرنامج تعمل بالفعل.\n`);
  } else {
    console.error(`\n✖ تعذّر تشغيل الخادم: ${error.message}\n`);
  }
  // نُبقي النافذة مفتوحة قليلًا حتى تُقرأ الرسالة عند التشغيل بدبل كليك
  setTimeout(() => process.exit(1), 15000);
});
