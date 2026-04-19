import type { Metadata } from 'next';
import { ensureSchema } from '@/lib/db';
import { getPlaylistsWithVideos } from '@/lib/playlists';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';

export const metadata: Metadata = {
  title: 'Videos',
  description:
    'Curated Premodern video playlists — gameplay, deck techs, tournament coverage, and creator features.',
};

export const revalidate = 300;

export default function VideosPage() {
  ensureSchema();
  const playlists = getPlaylistsWithVideos({ publishedOnly: true });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl text-[var(--term-amber)] tracking-widest">
          &gt; VIDEOS
        </h1>
        <p className="opacity-80 mt-2 max-w-3xl">
          Hand-picked Premodern videos from the community: gameplay, deck techs,
          tournament coverage, and creator features.
        </p>
      </div>

      {playlists.length === 0 ? (
        <div className="panel">
          <p className="opacity-70 text-sm">
            No playlists published yet. Check back soon, or browse the{' '}
            <a href="/community">community page</a> for creator channels.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {playlists.map((p) => (
            <section key={p.id} id={p.slug}>
              <h2 className="text-2xl text-[var(--term-amber)] tracking-widest mb-1">
                &gt; {p.title}
              </h2>
              {p.description ? (
                <p className="opacity-75 text-sm mb-3 max-w-3xl">{p.description}</p>
              ) : null}
              {p.videos.length === 0 ? (
                <p className="opacity-60 text-sm">No videos in this playlist yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  {p.videos.map((v) => (
                    <article key={v.id} className="space-y-2">
                      <YouTubeEmbed videoId={v.youtube_id} title={v.title} />
                      <div>
                        {v.title ? (
                          <a
                            href={`https://www.youtube.com/watch?v=${v.youtube_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold"
                          >
                            {v.title}
                          </a>
                        ) : (
                          <a
                            href={`https://www.youtube.com/watch?v=${v.youtube_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold"
                          >
                            youtube.com/watch?v={v.youtube_id}
                          </a>
                        )}
                        {v.creator ? (
                          <span className="opacity-65 text-sm"> · {v.creator}</span>
                        ) : null}
                      </div>
                      {v.note ? <p className="opacity-70 text-sm">{v.note}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
