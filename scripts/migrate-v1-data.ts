/**
 * Migrate v1 data into the v3 SQLite database.
 *
 * Reads:
 *   - v1/data/decks/*.json   (all tournament decks)
 *   - v1/data/card_db.json   (Scryfall card metadata)
 *   - v1/data/legal_sets.json
 *   - v1/data/banned_cards.json
 *
 * Writes:
 *   - v3/data/premodern.db   (SQLite)
 *
 * Run with: npm run migrate
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { SCHEMA } from '../src/lib/db';
import { ARCHETYPE_ALIASES, normalizeArchetype, resolveAlias, archetypeDisplay } from '../src/lib/archetype-aliases';

const V1_ROOT = path.resolve(__dirname, '..', '..', 'v1');
const V1_DECKS_DIR = path.join(V1_ROOT, 'data', 'decks');
const V1_CARD_DB = path.join(V1_ROOT, 'data', 'card_db.json');
const V1_LEGAL_SETS = path.join(V1_ROOT, 'data', 'legal_sets.json');
const V1_BANNED_CARDS = path.join(V1_ROOT, 'data', 'banned_cards.json');

const V3_DATA_DIR = path.resolve(__dirname, '..', 'data');
const V3_DB_PATH = path.join(V3_DATA_DIR, 'premodern.db');

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function ensureDataDir() {
  fs.mkdirSync(V3_DATA_DIR, { recursive: true });
}

function openDb(): Database.Database {
  const db = new Database(V3_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

function parseColorIdentity(raw: unknown): string {
  if (Array.isArray(raw)) return JSON.stringify(raw);
  if (typeof raw === 'string') {
    const chars = raw.split('').filter((c) => 'WUBRG'.includes(c));
    return JSON.stringify(chars);
  }
  return JSON.stringify([]);
}

function ingestCards(db: Database.Database) {
  if (!fs.existsSync(V1_CARD_DB)) {
    log(`Skipping card DB ingest - file not found: ${V1_CARD_DB}`);
    return 0;
  }
  log(`Loading card DB from ${V1_CARD_DB}...`);
  const raw = fs.readFileSync(V1_CARD_DB, 'utf-8');
  const cards = JSON.parse(raw) as unknown;
  if (!cards || typeof cards !== 'object') return 0;

  const entries: Array<[string, Record<string, unknown>]> = Array.isArray(cards)
    ? (cards as Array<Record<string, unknown>>).map((c) => [String(c.name ?? ''), c])
    : Object.entries(cards as Record<string, Record<string, unknown>>);

  log(`Ingesting ${entries.length} cards...`);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO cards (
      name, type_line, color_identity, mana_cost, cmc, is_land,
      earliest_set, released_at, image_small, image_normal, price_usd, price_eur
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const txn = db.transaction(() => {
    let n = 0;
    for (const [nameKey, raw] of entries) {
      const name = String(raw.name ?? nameKey ?? '').trim();
      if (!name) continue;
      const typeLine = raw.type_line ? String(raw.type_line) : null;
      const colorIdentity = parseColorIdentity(raw.color_identity);
      const manaCost = raw.mana_cost ? String(raw.mana_cost) : null;
      const cmc = typeof raw.cmc === 'number' ? raw.cmc : raw.cmc != null ? Number(raw.cmc) : null;
      const isLand = typeLine && /\bLand\b/i.test(typeLine) ? 1 : 0;
      const earliestSet = raw.earliest_set ? String(raw.earliest_set) : null;
      const releasedAt = raw.released_at ? String(raw.released_at) : null;

      const images = (raw.image_uris ?? {}) as Record<string, string>;
      const imageSmall = raw.image_small ? String(raw.image_small) : images.small ?? null;
      const imageNormal = raw.image_normal ? String(raw.image_normal) : images.normal ?? null;

      const prices = (raw.prices ?? {}) as Record<string, string | null>;
      const priceUsd =
        typeof raw.price_usd === 'number'
          ? raw.price_usd
          : prices.usd != null
            ? Number(prices.usd)
            : null;
      const priceEur =
        typeof raw.price_eur === 'number'
          ? raw.price_eur
          : prices.eur != null
            ? Number(prices.eur)
            : null;

      stmt.run(
        name,
        typeLine,
        colorIdentity,
        manaCost,
        cmc,
        isLand,
        earliestSet,
        releasedAt,
        imageSmall,
        imageNormal,
        Number.isFinite(priceUsd) ? priceUsd : null,
        Number.isFinite(priceEur) ? priceEur : null
      );
      n++;
    }
    return n;
  });

  const inserted = txn();
  log(`Ingested ${inserted} cards`);
  return inserted;
}

function ingestDecks(db: Database.Database) {
  if (!fs.existsSync(V1_DECKS_DIR)) {
    log(`Skipping deck ingest - dir not found: ${V1_DECKS_DIR}`);
    return 0;
  }
  const files = fs.readdirSync(V1_DECKS_DIR).filter((f) => f.endsWith('.json'));
  log(`Found ${files.length} deck files in ${V1_DECKS_DIR}`);

  const existing = new Set(
    (db.prepare('SELECT file_path FROM decks').all() as Array<{ file_path: string }>).map(
      (r) => r.file_path
    )
  );
  log(`${existing.size} decks already ingested`);

  const insertDeck = db.prepare(`
    INSERT INTO decks (source, source_url, player, event, date, archetype_raw, archetype_key, placement, file_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCard = db.prepare(`
    INSERT INTO deck_cards (deck_id, card_name, quantity, section) VALUES (?, ?, ?, ?)
  `);

  let inserted = 0;
  let batch: string[] = [];

  const process = db.transaction((batchFiles: string[]) => {
    for (const fname of batchFiles) {
      if (existing.has(fname)) continue;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(fs.readFileSync(path.join(V1_DECKS_DIR, fname), 'utf-8')) as Record<string, unknown>;
      } catch (err) {
        console.warn(`Failed to load ${fname}:`, err);
        continue;
      }
      const archRaw = (data.archetype as string) || 'Unknown';
      const archKey = resolveAlias(normalizeArchetype(archRaw));
      const info = insertDeck.run(
        (data.source as string) ?? '',
        (data.source_url as string) ?? '',
        (data.player as string) ?? '',
        (data.event as string) ?? '',
        (data.date as string) ?? '',
        archRaw,
        archKey,
        (data.placement as string) ?? '',
        fname
      );
      const deckId = Number(info.lastInsertRowid);

      for (const [card, qty] of Object.entries((data.mainboard as Record<string, number>) ?? {})) {
        insertCard.run(deckId, card, qty, 'mainboard');
      }
      for (const [card, qty] of Object.entries((data.sideboard as Record<string, number>) ?? {})) {
        insertCard.run(deckId, card, qty, 'sideboard');
      }
      inserted++;
    }
  });

  const BATCH = 500;
  for (const fname of files) {
    batch.push(fname);
    if (batch.length >= BATCH) {
      process(batch);
      log(`  Processed ${inserted} / ${files.length - existing.size} new decks`);
      batch = [];
    }
  }
  if (batch.length) process(batch);

  // Apply alias remapping to any stale keys already in DB.
  const updateStmt = db.prepare('UPDATE decks SET archetype_key = ? WHERE archetype_key = ?');
  for (const [oldKey, newKey] of Object.entries(ARCHETYPE_ALIASES)) {
    updateStmt.run(newKey, oldKey);
  }

  log(`Ingested ${inserted} new decks (total: ${existing.size + inserted})`);
  return inserted;
}

function ingestLegalSets(db: Database.Database) {
  if (!fs.existsSync(V1_LEGAL_SETS)) return 0;
  const raw = JSON.parse(fs.readFileSync(V1_LEGAL_SETS, 'utf-8')) as unknown;
  const rows: Array<Record<string, unknown>> = Array.isArray(raw)
    ? (raw as Array<Record<string, unknown>>)
    : Object.values(raw as Record<string, Record<string, unknown>>);

  db.exec('DELETE FROM legal_sets');
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO legal_sets (code, name, released_at) VALUES (?, ?, ?)'
  );
  const txn = db.transaction(() => {
    for (const r of rows) {
      const code = String(r.code ?? r.exp ?? '').trim();
      if (!code) continue;
      const name = String(r.name ?? r.expName ?? code);
      const released = String(r.released_at ?? r.releaseDate ?? '');
      stmt.run(code, name, released);
    }
  });
  txn();
  const n = (db.prepare('SELECT COUNT(*) as n FROM legal_sets').get() as { n: number }).n;
  log(`Ingested ${n} legal sets`);
  return n;
}

function ingestBannedCards(db: Database.Database) {
  if (!fs.existsSync(V1_BANNED_CARDS)) return 0;
  const raw = JSON.parse(fs.readFileSync(V1_BANNED_CARDS, 'utf-8')) as unknown;
  const rows: Array<Record<string, unknown>> = Array.isArray(raw)
    ? (raw as Array<Record<string, unknown>>)
    : Object.values(raw as Record<string, Record<string, unknown>>);

  db.exec('DELETE FROM banned_cards');
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO banned_cards (name, status, banned_date, reason) VALUES (?, ?, ?, ?)'
  );
  const txn = db.transaction(() => {
    for (const r of rows) {
      const name = String(r.name ?? r.cardName ?? '').trim();
      if (!name) continue;
      stmt.run(
        name,
        String(r.status ?? 'banned'),
        String(r.banned_date ?? r.date ?? ''),
        String(r.reason ?? r.text ?? '')
      );
    }
  });
  txn();
  const n = (db.prepare('SELECT COUNT(*) as n FROM banned_cards').get() as { n: number }).n;
  log(`Ingested ${n} banned cards`);
  return n;
}

async function main() {
  ensureDataDir();
  log(`Migrating into ${V3_DB_PATH}`);
  const db = openDb();

  ingestCards(db);
  ingestLegalSets(db);
  ingestBannedCards(db);
  ingestDecks(db);

  // Build archetypes summary table via the shared query helper.
  const { rebuildArchetypes } = await import('../src/lib/queries');
  // queries.ts uses getDb() which respects PREMODERN_DB_PATH.
  process.env.PREMODERN_DB_PATH = V3_DB_PATH;
  const archCount = rebuildArchetypes();
  log(`Built ${archCount} archetypes`);

  const totalDecks = (db.prepare('SELECT COUNT(*) as n FROM decks').get() as { n: number }).n;
  const totalCards = (db.prepare('SELECT COUNT(*) as n FROM cards').get() as { n: number }).n;
  log(`Done. ${totalDecks} decks, ${totalCards} cards, ${archCount} archetypes.`);

  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
