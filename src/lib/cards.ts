import type { Color } from './types';

// Scryfall CDN direct URLs by exact card name.
// Fast path: cards table has image_small/image_normal; for unknown cards,
// fall back to the Scryfall named endpoint.
export function scryfallNamedImage(name: string, size: 'small' | 'normal' = 'small'): string {
  const n = encodeURIComponent(name);
  return `https://api.scryfall.com/cards/named?exact=${n}&format=image&version=${size}`;
}

export function scryfallSearchUrl(name: string): string {
  return `https://scryfall.com/search?q=${encodeURIComponent('!"' + name + '"')}`;
}

export function parseColorIdentity(raw: string | null | undefined): Color[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((c): c is Color => ['W', 'U', 'B', 'R', 'G'].includes(c));
    }
  } catch {
    // Fall through to string handling.
  }
  return raw
    .split('')
    .filter((c): c is Color => ['W', 'U', 'B', 'R', 'G'].includes(c));
}

export function colorName(c: Color): string {
  return ({ W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' } as const)[c];
}
