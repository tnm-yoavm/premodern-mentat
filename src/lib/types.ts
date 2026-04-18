export type DeckSection = 'mainboard' | 'sideboard';

export interface Card {
  name: string;
  type_line: string | null;
  color_identity: string | null; // JSON string e.g. '["U","R"]'
  mana_cost: string | null;
  cmc: number | null;
  is_land: 0 | 1;
  image_small: string | null;
  image_normal: string | null;
  price_usd: number | null;
  price_eur: number | null;
}

export interface Deck {
  id: number;
  source: string;
  source_url: string;
  player: string;
  event: string;
  date: string;
  archetype_raw: string;
  archetype_key: string;
  placement: string;
  file_path: string;
}

export interface DeckCard {
  deck_id: number;
  card_name: string;
  quantity: number;
  section: DeckSection;
}

export interface Archetype {
  key: string;
  display_name: string;
  deck_count: number;
  meta_pct: number;
  color_identity: string; // JSON string
}

export interface ArchetypeSummary extends Archetype {
  colors: string[]; // decoded from color_identity
}

export interface ArchetypeCardStat {
  card_name: string;
  section: DeckSection;
  deck_count: number;
  total_qty: number;
  inclusion_pct: number;
  avg_copies: number;
}

export interface StapleCard {
  card_name: string;
  archetype_count: number;
  deck_pct: number;
  avg_copies: number;
  archetypes: Array<{ key: string; name: string }>;
  colors: string[];
}

export interface DeckListEntry {
  deck_id: number;
  player: string;
  event: string;
  date: string;
  archetype_key: string;
  archetype_display: string;
  placement: string;
  source: string;
  source_url: string;
}

export const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'] as const;
export type Color = (typeof COLOR_ORDER)[number];
