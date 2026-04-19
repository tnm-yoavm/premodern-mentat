import { redirect } from 'next/navigation';
import { isAdminAuthenticated, isAdminConfigured, loginAdmin } from '@/lib/auth';

export const metadata = { title: 'Admin Login', robots: { index: false, follow: false } };

interface Props {
  searchParams: Promise<{ error?: string; next?: string }>;
}

async function loginAction(formData: FormData) {
  'use server';
  const password = String(formData.get('password') || '');
  const next = String(formData.get('next') || '/admin');
  const ok = await loginAdmin(password);
  if (!ok) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }
  redirect(next.startsWith('/') ? next : '/admin');
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;
  if (await isAdminAuthenticated()) redirect('/admin');

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-3xl text-[var(--term-amber)] tracking-widest mb-4">
        &gt; ADMIN LOGIN
      </h1>
      {!isAdminConfigured() ? (
        <div className="panel">
          <p className="opacity-80 text-sm">
            Admin is not configured on this deployment. Set the{' '}
            <code className="text-[var(--term-amber)]">ADMIN_PASSWORD</code>{' '}
            environment variable to enable the admin panel.
          </p>
        </div>
      ) : (
        <form action={loginAction} className="panel space-y-3">
          <input type="hidden" name="next" value={next || '/admin'} />
          <label className="block">
            <span className="block text-sm opacity-80 mb-1">password</span>
            <input
              type="password"
              name="password"
              autoFocus
              required
              className="search-input"
            />
          </label>
          {error ? (
            <p className="text-[var(--term-red)] text-sm">&gt; access denied</p>
          ) : null}
          <button type="submit" className="term-btn">
            &gt; authenticate
          </button>
        </form>
      )}
    </div>
  );
}
