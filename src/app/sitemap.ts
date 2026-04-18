import type { MetadataRoute } from 'next';
import { getArchetypes, getTotalDeckCount } from '@/lib/queries';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/staples`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/format`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Ensure the database exists before trying to query. In local dev this may
  // not be true on a fresh clone; fail gracefully.
  let archetypes: Array<{ key: string }> = [];
  try {
    if (getTotalDeckCount() > 0) {
      archetypes = getArchetypes().map((a) => ({ key: a.key }));
    }
  } catch {
    // Database not migrated yet — return only static routes.
  }

  const archRoutes: MetadataRoute.Sitemap = archetypes.map((a) => ({
    url: `${BASE}/archetype/${encodeURIComponent(a.key)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...archRoutes];
}
