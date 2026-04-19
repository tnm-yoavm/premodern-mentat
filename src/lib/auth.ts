import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length > 0 ? p : null;
}

function sessionSecret(): string {
  // Allow overriding for explicit session rotation; default derives from the
  // password so rotating the password also invalidates existing sessions.
  return process.env.ADMIN_SESSION_SECRET || `pmm-admin::${adminPassword() ?? ''}`;
}

/** Token written into the cookie. Verified in constant time on each request. */
function expectedToken(): string {
  return createHash('sha256').update(sessionSecret()).digest('hex');
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function isAdminConfigured(): boolean {
  return adminPassword() !== null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const store = await cookies();
  const tok = store.get(COOKIE_NAME)?.value;
  if (!tok) return false;
  return safeEq(tok, expectedToken());
}

/** Use in server components / route handlers; redirects to login if unauthed. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }
}

export async function loginAdmin(password: string): Promise<boolean> {
  const expected = adminPassword();
  if (!expected) return false;
  if (!safeEq(password, expected)) return false;
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: expectedToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
