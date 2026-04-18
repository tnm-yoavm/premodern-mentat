// Normalization and alias mappings ported from v1/db.py.
// Keep in sync with the v1 source of truth.

export const ARCHETYPE_ALIASES: Record<string, string> = {
  'mono-blue stiflenought': 'stiflenought',
  'azorius stiflenought': 'stiflenought',
  'dimir stiflenought': 'stiflenought',
  '5c stiflenought': 'stiflenought',
  'mono-red sligh': 'sligh (rdw)',
  'gruul sligh': 'sligh (rdw)',
  'mono-red goblins': 'goblins',
  'boros goblins': 'goblins',
  'gruul goblins': 'goblins',
  'temur goblins': 'goblins',
  'selesnya terragedon': 'terrageddon',
  'naya terragedon': 'terrageddon',
  '4c terragedon': 'terrageddon',
  'selesnya enchantress': 'enchantress',
  'azorius replenish': 'replenish',
  '4c replenish': 'replenish',
  'jeskai replenish': 'replenish',
  'simic madness': 'madness',
  '4c madness': 'madness',
  'ub psychatog': 'psychatog',
  'mono-red land destruction': 'land destruction',
  'gruul land destruction': 'land destruction',
  'selesnya land destruction': 'land destruction',
  b: 'mono black aggro',
  g: 'stompy',
  'mono-white': 'white weenie',
  'mono-blue': 'mono blue control',
  'mono-black': 'mono black aggro',
};

export function normalizeArchetype(name: string): string {
  return (name || '').trim().toLowerCase();
}

export function resolveAlias(key: string): string {
  return ARCHETYPE_ALIASES[key] ?? key;
}

export function archetypeDisplay(key: string): string {
  // Title-case each word, preserving parenthetical tags.
  return key
    .split(' ')
    .map((w) => {
      if (w.startsWith('(') && w.endsWith(')')) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

export function archetypeSlug(key: string): string {
  return encodeURIComponent(key);
}
