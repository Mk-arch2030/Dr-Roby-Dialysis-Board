import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * مسارات التشغيل:
 * - أثناء التطوير/التشغيل عبر tsx: الملفات داخل المشروع.
 * - في النسخة المغلّفة (exe): الواجهة داخل الحزمة، وقاعدة البيانات في مجلد `data` بجوار الملف التنفيذي.
 *   ملاحظة: لا يوجد `__dirname` في ESM، و`import.meta` غير متاح في حزمة CJS — لذلك نستخدم الاثنين بحذر.
 */
const cjsDir = typeof __dirname === 'string' ? __dirname : '';

export const isPackaged = Boolean((process as unknown as { pkg?: unknown }).pkg);

const serverDir = isPackaged ? cjsDir : dirname(fileURLToPath(import.meta.url));
const projectRoot = isPackaged ? resolve(cjsDir, '..') : resolve(serverDir, '..');

/** مجلد ملفات الواجهة المبنية (dist) */
export const assetsDir = resolve(projectRoot, 'dist');

/**
 * مجلد بيانات الوحدة (قاعدة البيانات):
 * - في النسخة المغلّفة: `data` بجوار الملف التنفيذي.
 * - لو كان المجلد غير قابل للكتابة (مثل Program Files): مجلد المستخدم.
 */
function pickDataDir(): string {
  if (!isPackaged) return resolve(serverDir, 'data');
  const besideExe = resolve(dirname(process.execPath), 'data');
  try {
    mkdirSync(besideExe, { recursive: true });
    return besideExe;
  } catch {
    return resolve(process.env.LOCALAPPDATA ?? homedir(), 'DrRobyClinic', 'data');
  }
}

export const dataDir = process.env.DB_PATH ? dirname(resolve(process.env.DB_PATH)) : pickDataDir();

export const dbFile = process.env.DB_PATH ? resolve(process.env.DB_PATH) : resolve(dataDir, 'board.db');

export function ensureDataDir(): void {
  mkdirSync(dirname(dbFile), { recursive: true });
}
