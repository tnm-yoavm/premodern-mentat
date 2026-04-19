# Daily Price Tracking via Scryfall Bulk Data

## Goal

Maintain a daily time series of card prices for every Premodern-legal printing,
plus the ability to view price history of *all* printings of the same card
(reprints) so users can compare e.g. an Onslaught fetchland's Onslaught printing
vs. its modern reprints.

The display surface is the existing `/card/[name]` page: add a price chart, with
a toggle that switches between "Premodern printings only" and "All printings".

## Why bulk data

The Scryfall MCP I built in `mtg_theme_decks/` is great for ad-hoc lookups but
makes one HTTP request per card. We have ~3,000 distinct legal-set printings of
~9,000+ cards in our deck DB plus their reprints — fetching individually would
violate Scryfall's "please use bulk data for batch needs" guidance.

Scryfall publishes [bulk data files](https://scryfall.com/docs/api/bulk-data):

| File             | Size  | Contents                                                                   |
| ---------------- | ----- | -------------------------------------------------------------------------- |
| `oracle_cards`   | ~30MB | One row per oracle card (no printings). Useful for fast oracle metadata.   |
| `default_cards`  | ~150MB | One row per Scryfall printing, "default" face only. **Use this.**          |
| `all_cards`      | ~500MB | Every printing including foreign-language and digital. Too large.          |

`default_cards` is what we want: every printing of every card, with `prices`
nested in each row.

The bulk index endpoint `https://api.scryfall.com/bulk-data` returns metadata
(including a `download_uri`) — we hit that first, then download the file at the
URI. Re-running the same `download_uri` is fine and respects edge caching.

## Storage

Two new tables, already added in `src/lib/db.ts`:

```sql
CREATE TABLE scryfall_printings (
    scryfall_id      TEXT PRIMARY KEY,        -- Scryfall UUID for this printing
    oracle_id        TEXT NOT NULL,           -- groups reprints of the same card
    name             TEXT NOT NULL,
    set_code         TEXT NOT NULL,
    set_name         TEXT,
    collector_number TEXT,
    released_at      TEXT,
    rarity           TEXT,
    image_normal     TEXT,
    is_legal_set     INTEGER NOT NULL DEFAULT 0,  -- in legal_sets (Premodern-legal)
    last_seen        TEXT
);
CREATE INDEX idx_scryfall_printings_oracle ON scryfall_printings(oracle_id);
CREATE INDEX idx_scryfall_printings_name   ON scryfall_printings(name);
CREATE INDEX idx_scryfall_printings_legal  ON scryfall_printings(is_legal_set);

CREATE TABLE card_prices (
    scryfall_id  TEXT NOT NULL,
    date         TEXT NOT NULL,    -- ISO date 'YYYY-MM-DD'
    usd          REAL,
    usd_foil     REAL,
    usd_etched   REAL,
    eur          REAL,
    tix          REAL,
    PRIMARY KEY (scryfall_id, date)
);
CREATE INDEX idx_card_prices_date ON card_prices(date);
```

### Sizing math

- ~3,500 Premodern-legal printings (29 sets × ~120 unique-printing cards average).
- Plus their reprints across modern sets — let's budget 5–10× = ~25,000 rows in
  `scryfall_printings` once we extend coverage to reprints.
- Daily price snapshots: 25,000 × 365 = ~9.1M rows/year in `card_prices`.

SQLite handles this cheerfully — total DB growth ~600MB/year, indexed lookups in
microseconds. **No need for Postgres for the foreseeable future.**

If we ever want long-term retention without growing forever, downsample older
data: keep daily for 90 days, weekly for 1 year, monthly thereafter.

## Ingest pipeline

`scripts/fetch-scryfall-prices.ts` does (in order):

1. Hit `https://api.scryfall.com/bulk-data/default-cards`, read `download_uri`
   and `updated_at`.
2. If `updated_at` matches what we already ingested today, no-op (idempotent).
3. Stream the JSON file (~150MB) — parse incrementally using
   `stream-json` so we don't load the whole array into memory.
4. For each card object:
   - Skip if it's not a paper card (`games` lacks `"paper"`) — we don't track
     MTGO-only or Arena-only entries here (tix prices come from MTGO printings
     of paper cards).
   - Determine `is_legal_set` by checking `set` against `legal_sets`.
   - Apply scope filter (see "Scoping" below).
   - Upsert into `scryfall_printings` (set `last_seen = today`).
   - Insert into `card_prices` with today's date — `INSERT OR REPLACE` so a
     re-run on the same day is safe.
5. Log totals and exit non-zero on parse failure (so cron alerts trigger).

### Scoping (which printings to track)

Storing all ~25,000 printings is fine, but ingesting a 150MB file daily for
prices we won't show is wasteful. Two-tier scope:

- **Always track** if `is_legal_set = 1` (the printing is in a Premodern-legal
  set). This is the default chart data.
- **Also track** if `oracle_id` matches *any* card whose oracle_id has at least
  one Premodern-legal printing. This gives us reprint history for the "show all
  printings" toggle without storing prices for cards never legal in Premodern.

The first run does a discovery pass over `oracle_id`s that have a legal-set
printing, caches them in memory, then filters subsequent rows. Later runs read
the set of tracked oracle_ids from `scryfall_printings`.

### Reprint detection

Once `scryfall_printings` exists, "reprints of card X" is a one-line query:

```sql
SELECT scryfall_id, set_code, released_at, is_legal_set
FROM scryfall_printings
WHERE oracle_id = (
    SELECT oracle_id FROM scryfall_printings
    WHERE name = ? AND is_legal_set = 1
    LIMIT 1
)
ORDER BY released_at;
```

## Scheduling

- **Vercel**: free-tier cron is daily-only, 1 job — perfect. Add
  `vercel.json` cron pointing at a route handler `/api/cron/prices` that
  shells the same logic. Guard with a header check against `CRON_SECRET`.
- **Local**: `npm run prices:fetch` invokes the same script directly.

Scryfall regenerates bulk data daily; running the cron at 09:00 UTC gives a
~6-hour buffer past their typical regen window.

## UI changes (later)

- `/card/[name]` adds a price chart panel. SSR-render the data points; render
  the chart with a tiny client component (no heavy chart lib — a hand-rolled
  SVG sparkline or [`uplot`](https://github.com/leeoniya/uPlot) (~40KB) is
  plenty for our needs).
- Toggle: **Premodern printings** (default — single line, "best legal printing"
  by lowest USD) vs. **All printings** (one line per printing, color-coded by
  set, hover for set name + collector number).
- Add a "current low" badge next to the existing `price_usd` field, sourced
  from the most recent `card_prices` row.

## What still has to happen before this ships

1. ✅ Schema in place (`scryfall_printings`, `card_prices`).
2. ⬜ `scripts/fetch-scryfall-prices.ts` skeleton implemented (this PR).
3. ⬜ Verify with a one-off run against the live `default_cards` dump.
4. ⬜ Wire up `vercel.json` cron once we have a deployment.
5. ⬜ Add `getPriceHistory(scryfallId | name, opts)` query helper.
6. ⬜ Build the chart UI on `/card/[name]`.
7. ⬜ Optional: `/card/[name]/reprints` listing all printings sorted by current
   USD, useful for budget-deck research.

## Open questions

- **Foil-only cards** (e.g. promos) — track separately or fold into the same
  series? Default plan: store `usd_foil` alongside `usd` per row, let the UI
  decide which to plot.
- **Etched prices** — newer reprint series have these; column is in the schema
  but we'll just store NULL for older printings.
- **Currencies** — start with USD only in the UI; EUR/TIX columns are stored
  but unused at first.
- **Backfill** — Scryfall doesn't publish historical price snapshots. Day 1 of
  our chart is the day we first run the ingest. (We could buy/scrape historical
  data later if it matters; probably doesn't.)
