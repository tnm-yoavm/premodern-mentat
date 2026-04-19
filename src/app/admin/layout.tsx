import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logoutAdmin } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';

export const metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
  robots: { index: false, follow: false },
};

async function logoutAction() {
  'use server';
  await logoutAdmin();
  redirect('/admin/login');
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Ensure new admin tables exist even on databases migrated before this feature.
  // Each admin page is responsible for calling requireAdmin() — the login page
  // gates itself, every other page should redirect on missing auth.
  ensureSchema();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--term-green-dark)] pb-2">
        <div className="flex items-baseline gap-3">
          <span className="text-[var(--term-amber)] tracking-widest">&gt; ADMIN</span>
          <Link href="/admin">playlists</Link>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="term-btn text-sm">
            &gt; logout
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
