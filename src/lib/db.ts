import Database from 'better-sqlite3';
import path from 'node:path';

type DB = Database.Database;

const DB_PATH = process.env.PREMODERN_DB_PATH
  ? path.resolve(process.env.PREMODERN_DB_PATH)
  : path.join(process.cwd(), 'data', 'premodern.db');

// Cache the connection across dev-reload boundaries.
declare global {
  // eslint-disable-next-line no-var
  var __premodernDb: DB | undefined;
}

export function getDb(): DB {
  if (globalThis.__premodernDb) return globalThis.__premodernDb;
  const db = new Database(DB_PATH, { readonly: false });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  globalThis.__premodernDb = db;
  return db;
}

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS cards (
    name TEXT PRIMARY KEY,
    type_line TEXT,
    color_identity TEXT,
    mana_cost TEXT,
    cmc REAL,
    is_land INTEGER DEFAULT 0,
    earliest_set TEXT,
    released_at TEXT,
    image_small TEXT,
    image_normal TEXT,
    price_usd REAL,
    price_eur REAL
);

CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT,
    source_url TEXT,
    player TEXT,
    event TEXT,
    date TEXT,
    archetype_raw TEXT,
    archetype_key TEXT,
    placement TEXT,
    file_path TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_decks_archetype ON decks(archetype_key);
CREATE INDEX IF NOT EXISTS idx_decks_date ON decks(date);

CREATE TABLE IF NOT EXISTS deck_cards (
    deck_id INTEGER NOT NULL,
    card_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    section TEXT NOT NULL,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deck_cards_deck ON deck_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_card ON deck_cards(card_name);

CREATE TABLE IF NOT EXISTS archetypes (
    key TEXT PRIMARY KEY,
    display_name TEXT,
    deck_count INTEGER DEFAULT 0,
    meta_pct REAL DEFAULT 0,
    color_identity TEXT
);

CREATE TABLE IF NOT EXISTS legal_sets (
    code TEXT PRIMARY KEY,
    name TEXT,
    released_at TEXT
);

CREATE TABLE IF NOT EXISTS banned_cards (
    name TEXT PRIMARY KEY,
    status TEXT,
    banned_date TEXT,
    reason TEXT
);
`;

export function initSchema(db: DB = getDb()): void {
  db.exec(SCHEMA);
}
