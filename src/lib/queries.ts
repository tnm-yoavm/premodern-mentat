import { getDb } from './db';
import { archetypeDisplay, resolveAlias } from './archetype-aliases';
import { parseColorIdentity } from './cards';
import type {
  Archetype,
  ArchetypeCardStat,
  ArchetypeSummary,
  Card,
  Deck,
  DeckCard,
  DeckListEntry,
  DeckSection,
  StapleCard,
} from './types';

export function getTotalDeckCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as n FROM decks').get() as { n: number };
  return row.n;
}

export function getArchetypes(): ArchetypeSummary[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT key, display_name, deck_count, meta_pct, color_identity
       FROM archetypes
       ORDER BY deck_count DESC, key ASC`
    )
    .all() as Archetype[];
  return rows.map((r) => ({
    ...r,
    colors: parseColorIdentity(r.color_identity),
  }));
}

export function getArchetype(key: string): ArchetypeSummary | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT key, display_name, deck_count, meta_pct, color_identity
       FROM archetypes WHERE key = ?`
    )
    .get(key) as Archetype | undefined;
  if (!row) return null;
  return { ...row, colors: parseColorIdentity(row.color_identity) };
}

export function getArchetypeDecks(key: string, limit = 200): DeckListEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id as deck_id, player, event, date, archetype_key, placement, source, source_url
       FROM decks
       WHERE archetype_key = ?
       ORDER BY date DESC, id DESC
       LIMIT ?`
    )
    .all(key, limit) as (Omit<DeckListEntry, 'archetype_display'>)[];
  return rows.map((r) => ({
    ...r,
    archetype_display: archetypeDisplay(r.archetype_key),
  }));
}

export function getArchetypeCardStats(key: string): {
  mainboard_spells: ArchetypeCardStat[];
  mainboard_lands: ArchetypeCardStat[];
  sideboard: ArchetypeCardStat[];
} {
  const db = getDb();
  // Total decks in this archetype (for percentage).
  const total = (db
    .prepare('SELECT COUNT(*) as n FROM decks WHERE archetype_key = ?')
    .get(key) as { n: number }).n;

  if (total === 0) {
    return { mainboard_spells: [], mainboard_lands: [], sideboard: [] };
  }

  // Aggregate card inclusion per (card_name, section) across decks of this archetype.
  const stats = db
    .prepare(
      `SELECT
          dc.card_name,
          dc.section,
          COUNT(DISTINCT dc.deck_id) as deck_count,
          SUM(dc.quantity) as total_qty,
          COALESCE(c.is_land, 0) as is_land,
          COALESCE(c.type_line, '') as type_line
       FROM deck_cards dc
       JOIN decks d ON d.id = dc.deck_id
       LEFT JOIN cards c ON c.name = dc.card_name
       WHERE d.archetype_key = ?
       GROUP BY dc.card_name, dc.section
       ORDER BY deck_count DESC, total_qty DESC`
    )
    .all(key) as Array<{
    card_name: string;
    section: DeckSection;
    deck_count: number;
    total_qty: number;
    is_land: number;
    type_line: string;
  }>;

  const mainboard_spells: ArchetypeCardStat[] = [];
  const mainboard_lands: ArchetypeCardStat[] = [];
  const sideboard: ArchetypeCardStat[] = [];

  for (const row of stats) {
    const stat: ArchetypeCardStat = {
      card_name: row.card_name,
      section: row.section,
      deck_count: row.deck_count,
      total_qty: row.total_qty,
      inclusion_pct: Math.round((row.deck_count / total) * 1000) / 10,
      avg_copies: Math.round((row.total_qty / row.deck_count) * 10) / 10,
    };
    if (row.section === 'sideboard') {
      sideboard.push(stat);
    } else {
      const looksLand =
        row.is_land === 1 || /\bLand\b/i.test(row.type_line) ||
        // Fallback heuristic when the card is missing from the cards table.
        (!row.type_line && /^(Plains|Island|Swamp|Mountain|Forest|Wastes)$/i.test(row.card_name));
      if (looksLand) mainboard_lands.push(stat);
      else mainboard_spells.push(stat);
    }
  }

  return { mainboard_spells, mainboard_lands, sideboard };
}

export function getDeck(id: number): {
  deck: Deck;
  mainboard: Array<DeckCard & Pick<Card, 'type_line' | 'color_identity' | 'price_usd' | 'image_small' | 'image_normal'>>;
  sideboard: Array<DeckCard & Pick<Card, 'type_line' | 'color_identity' | 'price_usd' | 'image_small' | 'image_normal'>>;
} | null {
  const db = getDb();
  const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(id) as Deck | undefined;
  if (!deck) return null;

  const rows = db
    .prepare(
      `SELECT dc.deck_id, dc.card_name, dc.quantity, dc.section,
              c.type_line, c.color_identity, c.price_usd, c.image_small, c.image_normal
       FROM deck_cards dc
       LEFT JOIN cards c ON c.name = dc.card_name
       WHERE dc.deck_id = ?
       ORDER BY dc.section, dc.card_name`
    )
    .all(id) as Array<DeckCard & Pick<Card, 'type_line' | 'color_identity' | 'price_usd' | 'image_small' | 'image_normal'>>;

  const mainboard = rows.filter((r) => r.section === 'mainboard');
  const sideboard = rows.filter((r) => r.section === 'sideboard');
  return { deck, mainboard, sideboard };
}

export function getCard(name: string): Card | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM cards WHERE name = ?').get(name) as Card | undefined) ?? null;
}

export function getCardArchetypes(name: string): Array<{ key: string; display_name: string; deck_count: number; inclusion_pct: number; avg_copies: number }> {
  const db = getDb();
  return db
    .prepare(
      `SELECT
          d.archetype_key as key,
          a.display_name,
          COUNT(DISTINCT d.id) as deck_count,
          a.deck_count as total_arch_decks,
          SUM(dc.quantity) as total_qty
       FROM deck_cards dc
       JOIN decks d ON d.id = dc.deck_id
       JOIN archetypes a ON a.key = d.archetype_key
       WHERE dc.card_name = ? AND dc.section = 'mainboard'
       GROUP BY d.archetype_key
       ORDER BY deck_count DESC
       LIMIT 20`
    )
    .all(name)
    .map((raw) => {
      const r = raw as { key: string; display_name: string; deck_count: number; total_arch_decks: number; total_qty: number };
      const inclusion_pct = r.total_arch_decks > 0 ? Math.round((r.deck_count / r.total_arch_decks) * 1000) / 10 : 0;
      const avg_copies = r.deck_count > 0 ? Math.round((r.total_qty / r.deck_count) * 10) / 10 : 0;
      return {
        key: r.key,
        display_name: r.display_name || archetypeDisplay(r.key),
        deck_count: r.deck_count,
        inclusion_pct,
        avg_copies,
      };
    });
}

export function getFormatStaples(minArchetypes = 3, limit = 200): StapleCard[] {
  const db = getDb();
  const totalDecks = getTotalDeckCount();
  if (totalDecks === 0) return [];

  const stats = db
    .prepare(
      `SELECT
          dc.card_name,
          COUNT(DISTINCT d.archetype_key) as archetype_count,
          COUNT(DISTINCT d.id) as deck_count,
          SUM(dc.quantity) as total_qty,
          COALESCE(c.color_identity, '') as color_identity
       FROM deck_cards dc
       JOIN decks d ON d.id = dc.deck_id
       LEFT JOIN cards c ON c.name = dc.card_name
       WHERE dc.section = 'mainboard'
       GROUP BY dc.card_name
       HAVING archetype_count >= ?
       ORDER BY archetype_count DESC, deck_count DESC
       LIMIT ?`
    )
    .all(minArchetypes, limit) as Array<{
    card_name: string;
    archetype_count: number;
    deck_count: number;
    total_qty: number;
    color_identity: string;
  }>;

  const archByCard = db.prepare(
    `SELECT DISTINCT d.archetype_key as key, a.display_name
     FROM deck_cards dc
     JOIN decks d ON d.id = dc.deck_id
     JOIN archetypes a ON a.key = d.archetype_key
     WHERE dc.card_name = ? AND dc.section = 'mainboard'
     ORDER BY a.deck_count DESC
     LIMIT 30`
  );

  return stats.map((s) => ({
    card_name: s.card_name,
    archetype_count: s.archetype_count,
    deck_pct: Math.round((s.deck_count / totalDecks) * 1000) / 10,
    avg_copies: s.deck_count > 0 ? Math.round((s.total_qty / s.deck_count) * 10) / 10 : 0,
    archetypes: archByCard.all(s.card_name).map((r) => {
      const row = r as { key: string; display_name: string | null };
      return { key: row.key, name: row.display_name || archetypeDisplay(row.key) };
    }),
    colors: parseColorIdentity(s.color_identity),
  }));
}

export function getLegalSets(): Array<{ code: string; name: string; released_at: string }> {
  const db = getDb();
  return db
    .prepare(
      `SELECT code, name, released_at FROM legal_sets ORDER BY released_at ASC, code ASC`
    )
    .all() as Array<{ code: string; name: string; released_at: string }>;
}

export function getBannedCards(): Array<{ name: string; status: string; banned_date: string; reason: string }> {
  const db = getDb();
  return db
    .prepare(`SELECT name, status, banned_date, reason FROM banned_cards ORDER BY name ASC`)
    .all() as Array<{ name: string; status: string; banned_date: string; reason: string }>;
}

/** Precompute archetype summary rows from the decks table. */
export function rebuildArchetypes(): number {
  const db = getDb();
  const totalDecks = getTotalDeckCount();
  db.exec('DELETE FROM archetypes');

  const deckRows = db
    .prepare(
      `SELECT archetype_key as key, COUNT(*) as deck_count
       FROM decks
       WHERE archetype_key != ''
       GROUP BY archetype_key`
    )
    .all() as Array<{ key: string; deck_count: number }>;

  const insert = db.prepare(
    `INSERT INTO archetypes (key, display_name, deck_count, meta_pct, color_identity) VALUES (?, ?, ?, ?, ?)`
  );

  // Derive color identity as union of colors from the top cards in each archetype.
  const colorQuery = db.prepare(
    `SELECT DISTINCT c.color_identity
     FROM deck_cards dc
     JOIN decks d ON d.id = dc.deck_id
     JOIN cards c ON c.name = dc.card_name
     WHERE d.archetype_key = ? AND dc.section = 'mainboard' AND c.color_identity IS NOT NULL`
  );

  const txn = db.transaction(() => {
    for (const row of deckRows) {
      const resolved = resolveAlias(row.key);
      const colorSet = new Set<string>();
      for (const ci of colorQuery.all(row.key) as Array<{ color_identity: string | null }>) {
        for (const c of parseColorIdentity(ci.color_identity)) colorSet.add(c);
      }
      const colors = ['W', 'U', 'B', 'R', 'G'].filter((c) => colorSet.has(c));
      const meta_pct = totalDecks > 0 ? Math.round((row.deck_count / totalDecks) * 1000) / 10 : 0;
      insert.run(
        resolved,
        archetypeDisplay(resolved),
        row.deck_count,
        meta_pct,
        JSON.stringify(colors)
      );
    }
  });

  txn();
  const n = (db.prepare('SELECT COUNT(*) as n FROM archetypes').get() as { n: number }).n;
  return n;
}
