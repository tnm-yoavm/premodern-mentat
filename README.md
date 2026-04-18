# Premodern Mentat

Strategic intelligence for the Premodern Magic: The Gathering format. Archetype breakdowns, card inclusion rates, deck lists, and format staples from 9,900+ indexed tournament decks.

## Stack

- **Next.js 15** (App Router, React Server Components)
- **SQLite** via `better-sqlite3` — read-optimized for analytics
- **Tailwind CSS** — retro DOS terminal theme (green-on-black, VT323)
- **Scryfall CDN** — card images served directly (no local caching)
- Designed to deploy to **Vercel**.

## Local development

```bash
# Install
npm install

# Migrate v1 data into the v3 SQLite database
# (reads ../v1/data/decks/*.json, cards, sets, banned list)
npm run migrate

# Start dev server
npm run dev
```

The dev server runs at http://localhost:3000. The database lives at `data/premodern.db` (gitignored).

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run migrate` | Import v1 deck JSONs + card DB into SQLite |
| `npm run typecheck` | TypeScript check without emit |
| `npm run lint` | Next.js lint |

## Routes

| Path | Description |
|------|-------------|
| `/` | Metagame overview: archetypes sorted by deck count, color filter |
| `/archetype/[slug]` | Archetype detail: card inclusion stats, recent decks |
| `/deck/[id]` | Full decklist with prices |
| `/card/[name]` | Card detail: which archetypes play it, inclusion %, synergies |
| `/staples` | Format-wide staples across 3+ archetypes |
| `/format` | Legal sets & banned/restricted list |
| `/about` | Project info, creator spotlight, community links |

## Data sources

- [MTGGoldfish Premodern metagame](https://www.mtggoldfish.com/metagame/premodern)
- [MTGTop8 Premodern](https://mtgtop8.com/format?f=PREM)
- [Scryfall](https://scryfall.com) for card metadata & images

## Deployment

Push to `main` → Vercel auto-deploys. Environment variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for OG tags, sitemap |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Enable Plausible analytics when set |
| `PREMODERN_DB_PATH` | Override SQLite location (default `./data/premodern.db`) |

## License

Work-in-progress community project. Deck and card data is aggregated from public tournament reports.
