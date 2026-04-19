import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  addVideo,
  deleteVideo,
  getPlaylistById,
  getPlaylistVideos,
  parseYouTubeId,
  updatePlaylist,
} from '@/lib/playlists';

export const metadata = { title: 'Edit playlist', robots: { index: false, follow: false } };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

async function updateAction(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id)) return;
  updatePlaylist(id, {
    title: String(formData.get('title') || '').trim(),
    slug: String(formData.get('slug') || '').trim(),
    description: String(formData.get('description') || ''),
    is_published: formData.get('is_published') === 'on',
  });
  revalidatePath(`/admin/playlists/${id}`);
  revalidatePath('/admin');
  revalidatePath('/videos');
}

async function addVideoAction(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = Number(formData.get('playlist_id'));
  if (!Number.isFinite(id)) return;
  const raw = String(formData.get('youtube') || '').trim();
  const youtubeId = parseYouTubeId(raw);
  if (!youtubeId) {
    redirect(`/admin/playlists/${id}?error=bad_url`);
  }
  addVideo(id, {
    youtube_id: youtubeId,
    title: String(formData.get('title') || '').trim(),
    creator: String(formData.get('creator') || '').trim(),
    note: String(formData.get('note') || '').trim(),
  });
  revalidatePath(`/admin/playlists/${id}`);
  revalidatePath('/videos');
}

async function deleteVideoAction(formData: FormData) {
  'use server';
  await requireAdmin();
  const playlistId = Number(formData.get('playlist_id'));
  const videoId = Number(formData.get('video_id'));
  if (Number.isFinite(videoId)) deleteVideo(videoId);
  if (Number.isFinite(playlistId)) {
    revalidatePath(`/admin/playlists/${playlistId}`);
    revalidatePath('/videos');
  }
}

export default async function EditPlaylistPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id: idStr } = await params;
  const { error } = await searchParams;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();
  const playlist = getPlaylistById(id);
  if (!playlist) notFound();
  const videos = getPlaylistVideos(id);

  return (
    <>
      <div className="text-sm opacity-70 mb-2">
        <Link href="/admin">&lt; playlists</Link>
      </div>
      <h1 className="text-3xl text-[var(--term-amber)] tracking-widest mb-3">
        &gt; {playlist.title}
      </h1>

      <section className="panel mb-6">
        <h2 className="panel-heading">&gt; metadata</h2>
        <form action={updateAction} className="space-y-3">
          <input type="hidden" name="id" value={playlist.id} />
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm opacity-80 mb-1">title</span>
              <input name="title" defaultValue={playlist.title} required className="search-input" />
            </label>
            <label className="block">
              <span className="block text-sm opacity-80 mb-1">slug</span>
              <input name="slug" defaultValue={playlist.slug} required className="search-input" />
            </label>
          </div>
          <label className="block">
            <span className="block text-sm opacity-80 mb-1">description</span>
            <textarea
              name="description"
              defaultValue={playlist.description ?? ''}
              rows={3}
              className="search-input"
              style={{ resize: 'vertical' }}
            />
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="is_published" defaultChecked={!!playlist.is_published} />
            <span className="text-sm opacity-80">published (visible on /videos)</span>
          </label>
          <div>
            <button type="submit" className="term-btn">&gt; save</button>
          </div>
        </form>
      </section>

      <section className="panel mb-6">
        <h2 className="panel-heading">&gt; add video</h2>
        {error === 'bad_url' ? (
          <p className="text-[var(--term-red)] text-sm mb-2">
            &gt; could not parse a YouTube video ID from that URL
          </p>
        ) : null}
        <form action={addVideoAction} className="space-y-3">
          <input type="hidden" name="playlist_id" value={playlist.id} />
          <label className="block">
            <span className="block text-sm opacity-80 mb-1">
              YouTube URL or 11-char video ID
            </span>
            <input
              name="youtube"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              className="search-input"
            />
          </label>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm opacity-80 mb-1">title (optional)</span>
              <input name="title" className="search-input" />
            </label>
            <label className="block">
              <span className="block text-sm opacity-80 mb-1">creator (optional)</span>
              <input name="creator" className="search-input" />
            </label>
          </div>
          <label className="block">
            <span className="block text-sm opacity-80 mb-1">note (optional)</span>
            <input name="note" className="search-input" />
          </label>
          <div>
            <button type="submit" className="term-btn">&gt; add video</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2 className="panel-heading">&gt; videos ({videos.length})</h2>
        {videos.length === 0 ? (
          <p className="opacity-70 text-sm">No videos yet.</p>
        ) : (
          <ul className="space-y-4">
            {videos.map((v) => (
              <li
                key={v.id}
                className="grid md:grid-cols-[200px_1fr_auto] gap-3 items-start border-b border-dashed border-[var(--term-green-dark)] pb-3 last:border-none last:pb-0"
              >
                <a
                  href={`https://www.youtube.com/watch?v=${v.youtube_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`}
                    alt={v.title || v.youtube_id}
                    className="border border-[var(--term-green-dark)] w-full"
                    loading="lazy"
                  />
                </a>
                <div>
                  <div className="font-bold">{v.title || `(${v.youtube_id})`}</div>
                  {v.creator ? <div className="opacity-70 text-sm">{v.creator}</div> : null}
                  {v.note ? <div className="opacity-70 text-sm mt-1">{v.note}</div> : null}
                  <div className="opacity-50 text-xs mt-1">id: {v.youtube_id}</div>
                </div>
                <form action={deleteVideoAction} className="self-start">
                  <input type="hidden" name="playlist_id" value={playlist.id} />
                  <input type="hidden" name="video_id" value={v.id} />
                  <button type="submit" className="term-btn text-sm">remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
