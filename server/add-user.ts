import { db, startupSeed } from './db';
import { hashPassword } from './passwords';
import type { Role } from '../src/types';

const ROLES: Role[] = ['doctor', 'nurse', 'admin'];
const [username, name, role, password] = process.argv.slice(2);

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

if (!username || !name || !role || !password) {
  fail('الاستخدام: npm run add-user -- <اسم-المستخدم> "<الاسم>" <doctor|nurse|admin> "<كلمة-المرور>"');
}
if (!ROLES.includes(role as Role)) fail(`الدور يجب أن يكون واحدًا من: ${ROLES.join(', ')}`);
if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
  fail('كلمة المرور يجب أن تكون ٨ أحرف على الأقل وتحتوي حروفًا وأرقامًا.');
}

startupSeed();

const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username);
if (existing) fail(`اسم المستخدم «${username}» مستخدم بالفعل.`);

const { hash, salt } = hashPassword(password);
db.prepare(
  'INSERT INTO users (username, name, role, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)',
).run(username, name, role, hash, salt, new Date().toISOString());

console.log(`✔ تم إنشاء حساب «${name}» باسم المستخدم ${username} بدور ${role}`);
