import Link from 'next/link';

export const metadata = {
  title: 'About Premodern Mentat',
  description:
    'About the Premodern Mentat project — data sources, community features, and roadmap for Premodern MTG analytics.',
};

const CREATORS = [
  { name: 'BANDING (Phil Nguyen)', href: 'https://mtgbanding.substack.com', note: 'Premodern primers, tournament reports, roundtables' },
  { name: 'NeonMushroom', href: 'https://www.youtube.com/@neonmushroom6763', note: 'Gameplay & deck techs' },
  { name: 'Fluorescent Fungus', href: 'https://www.youtube.com/@FluorescentFungus', note: 'Creator showdowns & gameplay' },
  { name: 'BoshNRoll', href: 'https://www.youtube.com/@BoshNRoll', note: 'Paper Premodern gameplay' },
  { name: 'StrataGames', href: 'https://www.youtube.com/@StrataGames', note: 'Deck techs & gameplay' },
  { name: 'Premodern MTGO', href: 'https://www.youtube.com/@PremodernMTGO', note: 'Online Premodern content' },
  { name: 'Cardmarket Magic (Andrea Mengucci)', href: 'https://www.youtube.com/@cardmarket_magic', note: 'Paper Premodern gameplay' },
];

const COMMUNITY = [
  { name: 'Premodern Discord', href: 'https://discord.com/invite/6FHPuFy' },
  { name: 'r/premodernMTG', href: 'https://www.reddit.com/r/premodernMTG/' },
  { name: 'Premodern Magic (official)', href: 'https://premodernmagic.com' },
  { name: 'Premodern on MTGO', href: 'https://www.mtgo.com/news/premodern-on-mtgo-2025' },
];

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <section>
        <h1 className="text-3xl md:text-4xl text-[var(--term-amber)] tracking-[0.1em]">
          &gt; About Premodern Mentat
        </h1>
        <p className="opacity-90 mt-3 leading-relaxed">
          Premodern Mentat is a data &amp; metagame intelligence site for the{' '}
          <a href="https://premodernmagic.com" target="_blank" rel="noreferrer">
            Premodern
          </a>{' '}
          format of <em>Magic: The Gathering</em> — legal sets 4th Edition (1995) through Scourge (2003).
          We index tournament decks from MTGGoldfish and MTGTop8 and surface archetype
          breakdowns, card inclusion rates, and format staples.
        </p>
      </section>

      <section className="panel">
        <div className="panel-heading">Data sources</div>
        <ul className="space-y-1 text-sm">
          <li>Tournament decks: <a href="https://www.mtggoldfish.com/metagame/premodern" target="_blank" rel="noreferrer">MTGGoldfish</a>, <a href="https://mtgtop8.com/format?f=PREM" target="_blank" rel="noreferrer">MTGTop8</a></li>
          <li>Card metadata &amp; prices: <a href="https://scryfall.com" target="_blank" rel="noreferrer">Scryfall</a></li>
          <li>Format rules: <a href="https://premodernmagic.com" target="_blank" rel="noreferrer">premodernmagic.com</a></li>
        </ul>
      </section>

      <section className="panel">
        <div className="panel-heading">Community</div>
        <ul className="space-y-1 text-sm">
          {COMMUNITY.map((c) => (
            <li key={c.href}>
              <a href={c.href} target="_blank" rel="noreferrer">
                {c.name} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-heading">Creator spotlight</div>
        <p className="opacity-80 text-sm mb-2">
          The Premodern community is kept alive by the people writing, streaming, and recording
          content. Check them out:
        </p>
        <ul className="space-y-1 text-sm">
          {CREATORS.map((c) => (
            <li key={c.href}>
              <a href={c.href} target="_blank" rel="noreferrer">
                {c.name} ↗
              </a>{' '}
              <span className="opacity-70">— {c.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-heading">Roadmap</div>
        <ol className="space-y-1 text-sm list-decimal list-inside">
          <li>Phase 1 (now): metagame, archetype &amp; deck pages, staples, card pages.</li>
          <li>Phase 2: weekly &quot;This Week in Premodern&quot; digest, content hub, search.</li>
          <li>Phase 3: user deck submissions, Discord login, tournament calendar.</li>
          <li>Phase 4: affiliate links (TCGPlayer / Card Kingdom), community sponsorships.</li>
        </ol>
      </section>

      <p className="opacity-70 text-sm">
        <Link href="/">← back to the metagame</Link>
      </p>
    </div>
  );
}
