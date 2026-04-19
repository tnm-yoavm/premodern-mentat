import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createPlaylist, deletePlaylist, getPlaylists, getPlaylistVideos } from '@/lib/playlists';

export const metadata = { title: 'Playlists', robots: { index: false, follow: false } };

async function createAction(formData: FormData) {
  'use server';
  await requireAdmin();
  const title = String(formData.get('title') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const description = String(formData.get('description') || '').trim();
  if (!title) return;
  const created = createPlaylist({ title, slug: slug || undefined, description });
  revalidatePath('/admin');
  revalidatePath('/videos');
  redirect(`/admin/playlists/${created.id}`);
}

async function deleteAction(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) deletePlaylist(id);
  revalidatePath('/admin');
  revalidatePath('/videos');
}

export default async function AdminIndexPage() {
  await requireAdmin();
  const playlists = getPlaylists();
  const counts = new Map<number, number>();
  for (const p of playlists) counts.set(p.id, getPlaylistVideos(p.id).length);

  return (
    <>
      <h1 className="text-3xl text-[var(--term-amber)] tracking-widest mb-3">
        &gt; CURATED PLAYLISTS
      </h1>

      <section className="panel mb-6">
        <h2 className="panel-heading">&gt; new playlist</h2>
        <form action={createAction} className="grid md:grid-cols-3 gap-2 items-end">
          <label className="block">
            <span className="block text-sm opacity-80 mb-1">title</span>
            <input name="title" required className="search-input" />
          </label>
          <label className="block">
            <span className="block text-sm opacity-80 mb-1">slug (optional)</span>
            <input name="slug" placeholder="auto from title" className="search-input" />
          </label>
          <button type="submit" className="term-btn justify-self-start">
            &gt; create
          </button>
          <label className="block md:col-span-3">
            <span className="block text-sm opacity-80 mb-1">description (optional)</span>
            <input name="description" className="search-input" />
          </label>
        </form>
      </section>

      <section className="panel">
        <h2 className="panel-heading">&gt; playlists ({playlists.length})</h2>
        {playlists.length === 0 ? (
          <p className="opacity-70 text-sm">No playlists yet.</p>
        ) : (
          <table className="term-table">
            <thead>
              <tr>
                <th>Title</th>
                <th className="w-32">Slug</th>
                <th className="w-20 text-right">Videos</th>
                <th className="w-24 text-center">Status</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {playlists.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/playlists/${p.id}`}>{p.title}</Link>
                    {p.description ? (
                      <div className="opacity-60 text-sm">{p.description}</div>
                    ) : null}
                  </td>
                  <td className="opacity-70 text-sm">{p.slug}</td>
                  <td className="text-right">{counts.get(p.id) ?? 0}</td>
                  <td className="text-center">
                    {p.is_published ? (
                      <span className="opacity-80">published</span>
                    ) : (
                      <span className="opacity-50">draft</span>
                    )}
                  </td>
                  <td className="text-right">
                    <form action={deleteAction} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="term-btn text-sm"
                        title="Delete playlist (cascades videos)"
                      >
                        del
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
