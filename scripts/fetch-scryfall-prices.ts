#!/usr/bin/env tsx
/**
 * Daily Scryfall price ingest — skeleton.
 *
 * 1. Hit /bulk-data/default-cards to discover the latest dump URI.
 * 2. Skip if we already ingested a snapshot tagged with that updated_at.
 * 3. Stream-ish download the JSON file, parse it, upsert printings, and
 *    insert today's prices for in-scope rows.
 *
 * Scope:
 *   - Always include printings whose `set` is in the `legal_sets` table.
 *   - Also include any printing whose `oracle_id` matches a card with at
 *     least one legal-set printing (so we get reprint history).
 *
 * Usage:
 *   npm run prices:fetch
 *
 * TODO before production:
 *   - Replace whole-file JSON.parse with a streaming parser (stream-json) so
 *     memory stays bounded under Vercel's 1GB serverless limit.
 *   - Wrap in a /api/cron/prices route handler guarded by CRON_SECRET, then
 *     wire it into vercel.json crons.
 *   - Add downsampling of older snapshots (>90 days → weekly, >1y → monthly).
 *   - Emit metrics (rows ingested, total elapsed, dump updated_at).
 */
import { getDb, ensureSchema } from '../src/lib/db';

const BULK_INDEX = 'https://api.scryfall.com/bulk-data/default-cards';
const USER_AGENT = 'PremodernMentat/0.1 (+https://github.com/tnm-yoavm/premodern-mentat)';

interface BulkInfo {
  download_uri: string;
  updated_at: string;
  size: number;
}

interface ScryfallCard {
  id: string;
  oracle_id?: string;
  name: string;
  set: string;
  set_name?: string;
  collector_number?: string;
  released_at?: string;
  rarity?: string;
  games?: string[];
  image_uris?: { normal?: string };
  card_faces?: Array<{ image_uris?: { normal?: string } }>;
  prices?: {
    usd?: string | null;
    usd_foil?: string | null;
    usd_etched?: string | null;
    eur?: string | null;
    tix?: string | null;
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`GET ${url} → ${r.status} ${r.statusText}`);
  return (await r.json()) as T;
}

function legalSetCodes(): Set<string> {
  const db = getDb();
  const rows = db.prepare('SELECT lower(code) as code FROM legal_sets').all() as Array<{ code: string }>;
  return new Set(rows.map((r) => r.code));
}

/** oracle_ids whose card has at least one legal-set printing — used to scope reprints. */
function trackedOracleIds(legalSets: Set<string>, cards: ScryfallCard[]): Set<string> {
  const ids = new Set<string>();
  for (const c of cards) {
    if (!c.oracle_id) continue;
    if (legalSets.has(c.set.toLowerCase())) ids.add(c.oracle_id);
  }
  return ids;
}

function extractImage(c: ScryfallCard): string | null {
  return c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal || null;
}

function num(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  ensureSchema();
  const db = getDb();
  const today = todayIso();

  // 1. Resolve dump URI.
  console.log('[prices] resolving bulk-data dump URI …');
  const info = await fetchJson<BulkInfo>(BULK_INDEX);
  console.log(
    `[prices] dump updated_at=${info.updated_at} size=${(info.size / 1e6).toFixed(1)}MB`
  );

  // 2. Idempotency — skip if we already have today's snapshot for any card.
  const already = (db
    .prepare('SELECT COUNT(*) as n FROM card_prices WHERE date = ?')
    .get(today) as { n: number }).n;
  if (already > 0 && process.env.FORCE_REINGEST !== '1') {
    console.log(`[prices] already have ${already} rows for ${today}; skipping (set FORCE_REINGEST=1 to override).`);
    return;
  }

  // 3. Download.
  console.log('[prices] downloading …');
  const startDl = Date.now();
  const r = await fetch(info.download_uri, { headers: { 'User-Agent': USER_AGENT } });
  if (!r.ok) throw new Error(`download failed: ${r.status} ${r.statusText}`);
  // NOTE: fine for ~150MB on a dev machine; switch to streaming JSON before prod cron.
  const cards = (await r.json()) as ScryfallCard[];
  console.log(
    `[prices] downloaded ${cards.length} cards in ${((Date.now() - startDl) / 1000).toFixed(1)}s`
  );

  // 4. Build scope: legal printings + reprints of cards with any legal printing.
  const legalSets = legalSetCodes();
  if (legalSets.size === 0) {
    console.warn('[prices] WARNING: legal_sets table is empty — run `npm run migrate` first.');
    return;
  }
  const tracked = trackedOracleIds(legalSets, cards);
  console.log(
    `[prices] scope: ${legalSets.size} legal sets · ${tracked.size} tracked oracle_ids`
  );

  // 5. Upsert printings + insert today's prices.
  const upsertPrinting = db.prepare(
    `INSERT INTO scryfall_printings
        (scryfall_id, oracle_id, name, set_code, set_name, collector_number,
         released_at, rarity, image_normal, is_legal_set, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(scryfall_id) DO UPDATE SET
        oracle_id = excluded.oracle_id,
        name = excluded.name,
        set_code = excluded.set_code,
        set_name = excluded.set_name,
        collector_number = excluded.collector_number,
        released_at = excluded.released_at,
        rarity = excluded.rarity,
        image_normal = excluded.image_normal,
        is_legal_set = excluded.is_legal_set,
        last_seen = excluded.last_seen`
  );

  const insertPrice = db.prepare(
    `INSERT OR REPLACE INTO card_prices
        (scryfall_id, date, usd, usd_foil, usd_etched, eur, tix)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  let printings = 0;
  let priceRows = 0;
  let skippedDigital = 0;

  const txn = db.transaction((batch: ScryfallCard[]) => {
    for (const c of batch) {
      // Paper-only.
      if (c.games && !c.games.includes('paper')) {
        skippedDigital++;
        continue;
      }
      const setCode = c.set.toLowerCase();
      const inLegalSet = legalSets.has(setCode);
      const inScope = inLegalSet || (c.oracle_id && tracked.has(c.oracle_id));
      if (!inScope) continue;

      upsertPrinting.run(
        c.id,
        c.oracle_id || '',
        c.name,
        setCode,
        c.set_name || null,
        c.collector_number || null,
        c.released_at || null,
        c.rarity || null,
        extractImage(c),
        inLegalSet ? 1 : 0,
        today
      );
      printings++;

      const p = c.prices || {};
      const usd = num(p.usd);
      const usdFoil = num(p.usd_foil);
      const usdEtched = num(p.usd_etched);
      const eur = num(p.eur);
      const tix = num(p.tix);

      // Skip the row if there is no price information at all.
      if (usd == null && usdFoil == null && usdEtched == null && eur == null && tix == null) {
        continue;
      }
      insertPrice.run(c.id, today, usd, usdFoil, usdEtched, eur, tix);
      priceRows++;
    }
  });

  // Process in chunks so the transaction journal stays bounded.
  const CHUNK = 5000;
  for (let i = 0; i < cards.length; i += CHUNK) {
    txn(cards.slice(i, i + CHUNK));
    if ((i / CHUNK) % 10 === 0) {
      process.stdout.write(`  … ${Math.min(i + CHUNK, cards.length)}/${cards.length}\r`);
    }
  }
  process.stdout.write('\n');

  console.log(
    `[prices] done: ${printings} printings touched, ${priceRows} price rows for ${today}` +
      ` (skipped ${skippedDigital} digital-only)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
