import { getDb } from './db';

export interface VideoPlaylist {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  position: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistVideo {
  id: number;
  playlist_id: number;
  youtube_id: string;
  title: string | null;
  creator: string | null;
  note: string | null;
  position: number;
  created_at: string;
}

export interface PlaylistWithVideos extends VideoPlaylist {
  videos: PlaylistVideo[];
}

/** Extract a YouTube video ID from a URL or accept a bare 11-char ID. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  // Bare ID
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      // /watch?v=ID
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      // /shorts/ID, /embed/ID, /live/ID
      const m = url.pathname.match(/\/(shorts|embed|live)\/([\w-]{11})/);
      if (m) return m[2];
    }
  } catch {
    // not a URL
  }
  return null;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function getPlaylists(opts: { publishedOnly?: boolean } = {}): VideoPlaylist[] {
  const db = getDb();
  const where = opts.publishedOnly ? 'WHERE is_published = 1' : '';
  return db
    .prepare(
      `SELECT id, slug, title, description, position, is_published, created_at, updated_at
       FROM video_playlists
       ${where}
       ORDER BY position ASC, id ASC`
    )
    .all() as VideoPlaylist[];
}

export function getPlaylistById(id: number): VideoPlaylist | null {
  const db = getDb();
  return (
    (db
      .prepare(
        `SELECT id, slug, title, description, position, is_published, created_at, updated_at
         FROM video_playlists WHERE id = ?`
      )
      .get(id) as VideoPlaylist | undefined) ?? null
  );
}

export function getPlaylistBySlug(slug: string): VideoPlaylist | null {
  const db = getDb();
  return (
    (db
      .prepare(
        `SELECT id, slug, title, description, position, is_published, created_at, updated_at
         FROM video_playlists WHERE slug = ?`
      )
      .get(slug) as VideoPlaylist | undefined) ?? null
  );
}

export function getPlaylistVideos(playlistId: number): PlaylistVideo[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, playlist_id, youtube_id, title, creator, note, position, created_at
       FROM playlist_videos WHERE playlist_id = ?
       ORDER BY position ASC, id ASC`
    )
    .all(playlistId) as PlaylistVideo[];
}

export function getPlaylistsWithVideos(opts: { publishedOnly?: boolean } = {}): PlaylistWithVideos[] {
  const playlists = getPlaylists(opts);
  return playlists.map((p) => ({ ...p, videos: getPlaylistVideos(p.id) }));
}

export function createPlaylist(input: {
  title: string;
  slug?: string;
  description?: string;
  is_published?: boolean;
}): VideoPlaylist {
  const db = getDb();
  const slug = (input.slug && slugify(input.slug)) || slugify(input.title);
  if (!slug) throw new Error('Title or slug is required');
  // Auto-position to end of list.
  const maxPos = (db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM video_playlists').get() as { m: number }).m;
  const result = db
    .prepare(
      `INSERT INTO video_playlists (slug, title, description, position, is_published)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      slug,
      input.title.trim(),
      input.description?.trim() || null,
      maxPos + 1,
      input.is_published === false ? 0 : 1
    );
  return getPlaylistById(Number(result.lastInsertRowid)) as VideoPlaylist;
}

export function updatePlaylist(
  id: number,
  patch: { title?: string; slug?: string; description?: string; is_published?: boolean }
): VideoPlaylist | null {
  const db = getDb();
  const existing = getPlaylistById(id);
  if (!existing) return null;
  const slug = patch.slug !== undefined ? slugify(patch.slug) || existing.slug : existing.slug;
  db.prepare(
    `UPDATE video_playlists
     SET title = ?, slug = ?, description = ?, is_published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    patch.title?.trim() || existing.title,
    slug,
    patch.description !== undefined ? (patch.description?.trim() || null) : existing.description,
    patch.is_published === undefined ? existing.is_published : patch.is_published ? 1 : 0,
    id
  );
  return getPlaylistById(id);
}

export function deletePlaylist(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM video_playlists WHERE id = ?').run(id).changes > 0;
}

export function addVideo(
  playlistId: number,
  input: { youtube_id: string; title?: string; creator?: string; note?: string }
): PlaylistVideo {
  const db = getDb();
  const maxPos = (db
    .prepare('SELECT COALESCE(MAX(position), -1) as m FROM playlist_videos WHERE playlist_id = ?')
    .get(playlistId) as { m: number }).m;
  const result = db
    .prepare(
      `INSERT INTO playlist_videos (playlist_id, youtube_id, title, creator, note, position)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      playlistId,
      input.youtube_id,
      input.title?.trim() || null,
      input.creator?.trim() || null,
      input.note?.trim() || null,
      maxPos + 1
    );
  // Touch the parent playlist's updated_at.
  db.prepare("UPDATE video_playlists SET updated_at = datetime('now') WHERE id = ?").run(playlistId);
  const id = Number(result.lastInsertRowid);
  return db
    .prepare(
      `SELECT id, playlist_id, youtube_id, title, creator, note, position, created_at
       FROM playlist_videos WHERE id = ?`
    )
    .get(id) as PlaylistVideo;
}

export function deleteVideo(videoId: number): boolean {
  const db = getDb();
  const row = db.prepare('SELECT playlist_id FROM playlist_videos WHERE id = ?').get(videoId) as
    | { playlist_id: number }
    | undefined;
  const changed = db.prepare('DELETE FROM playlist_videos WHERE id = ?').run(videoId).changes > 0;
  if (changed && row) {
    db.prepare("UPDATE video_playlists SET updated_at = datetime('now') WHERE id = ?").run(row.playlist_id);
  }
  return changed;
}

export function reorderVideos(playlistId: number, orderedIds: number[]): void {
  const db = getDb();
  const txn = db.transaction((ids: number[]) => {
    const update = db.prepare(
      'UPDATE playlist_videos SET position = ? WHERE id = ? AND playlist_id = ?'
    );
    ids.forEach((id, i) => update.run(i, id, playlistId));
  });
  txn(orderedIds);
  db.prepare("UPDATE video_playlists SET updated_at = datetime('now') WHERE id = ?").run(playlistId);
}
