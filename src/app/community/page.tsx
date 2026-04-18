import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description:
    'The Premodern community hub — Discord, Reddit, content creators, tournaments, written articles, and official accounts for the Premodern Magic: The Gathering format.',
};

type Link = { name: string; url: string; by?: string; blurb?: string };
type Section = { heading: string; subtitle?: string; links: Link[] };

const SECTIONS: Section[] = [
  {
    heading: 'Official & hubs',
    subtitle: 'Where the format is organized and announcements go out.',
    links: [
      { name: 'Premodern Magic', url: 'https://premodernmagic.com', by: 'Official', blurb: 'Official format hub and central reference.' },
      { name: 'Premodern Content Galore', url: 'https://premodernmagic.com/blog/premodern-content-galore/', by: 'Premodern Magic', blurb: 'Curated index of Premodern creators and resources.' },
      { name: 'Premodern Tournament Reports', url: 'https://premodernmagic.com/blog/category/tournament-report/', by: 'Premodern Magic', blurb: 'Tournament-report archive.' },
      { name: 'Premodern Community Forum', url: 'https://www.premodern.gg/hc/en-us/community/topics', by: 'Premodern GG', blurb: 'Official community forum topics.' },
      { name: 'Premodern on MTGO announcement', url: 'https://www.mtgo.com/news/premodern-on-mtgo-2025', by: 'Magic Online', blurb: 'Official launch of Premodern on MTGO.' },
    ],
  },
  {
    heading: 'Chat & discussion',
    subtitle: 'Real-time conversation with players around the world.',
    links: [
      { name: 'Premodern Discord', url: 'https://discord.com/invite/6FHPuFy', by: 'Official', blurb: 'The main Discord server — find online matches, talk decks, share results.' },
      { name: 'Portland Premodern Discord', url: 'https://discord.gg/ka7WweJsHs', by: 'Regional', blurb: 'Regional Discord for the Portland-area community.' },
      { name: 'r/premodernMTG', url: 'https://www.reddit.com/r/premodernMTG/', by: 'Reddit', blurb: 'The subreddit — tournament reports, meta discussion, deck tech.' },
      { name: 'Premodern creator thread', url: 'https://www.reddit.com/r/premodernMTG/comments/1l13k65/premordern_content_creators/', by: 'r/premodernMTG', blurb: 'Community-curated list of content creators.' },
    ],
  },
  {
    heading: 'Tournament results & deck databases',
    subtitle: 'Where published decks come from — these feed Premodern Mentat.',
    links: [
      { name: 'MTGGoldfish Premodern metagame', url: 'https://www.mtggoldfish.com/metagame/premodern', by: 'MTGGoldfish', blurb: 'Metagame overview and paper metashares.' },
      { name: 'MTGGoldfish Premodern tournaments', url: 'https://www.mtggoldfish.com/tournaments/premodern', by: 'MTGGoldfish', blurb: 'Recent tournament results and decklists.' },
      { name: 'MTGTop8 Premodern archetypes', url: 'https://mtgtop8.com/archetype?f=PREM', by: 'MTGTop8', blurb: 'Archetype decklists and historical results.' },
      { name: 'MTGDecks Premodern', url: 'https://mtgdecks.net/Premodern/decklists', by: 'MTGDecks.net', blurb: 'Decklist database for Premodern.' },
      { name: 'Deck Scout — MTGO Premodern', url: 'https://deckscout.fyi/mtgo/premodern/', by: 'Deck Scout', blurb: 'MTGO tournament results tracker.' },
      { name: 'TCDecks Premodern', url: 'https://www.tcdecks.net/format.php?format=Premodern', by: 'TCDecks', blurb: 'Paper tournament decklists.' },
      { name: 'MTGO decklists', url: 'https://www.mtgo.com/decklists', by: 'Magic Online', blurb: 'Official MTGO decklists hub.' },
    ],
  },
  {
    heading: 'Written content',
    subtitle: 'Primers, tournament reports, and deeper format writing.',
    links: [
      { name: 'BANDING', url: 'https://mtgbanding.substack.com', by: 'Phil Nguyen', blurb: 'The most prolific Premodern writing — primers, reports, and roundtables.' },
      { name: 'BANDING · The Premodern Roundtable 2025', url: 'https://mtgbanding.substack.com/p/the-premodern-roundtable-2025-edition', by: 'Phil Nguyen' },
      { name: 'BANDING · Land-based strategies in Premodern', url: 'https://mtgbanding.substack.com/p/land-based-strategies-in-premodern', by: 'Phil Nguyen' },
      { name: 'BANDING · What does the future of Premodern look like?', url: 'https://mtgbanding.substack.com/p/what-does-the-future-of-premodern', by: 'Phil Nguyen' },
      { name: 'BANDING · How to grow your own local Premodern scene', url: 'https://mtgbanding.substack.com/p/how-to-grow-your-own-local-premodern', by: 'Phil Nguyen' },
      { name: 'SWB MTG Blog · First weekly league', url: 'https://swbmtg.substack.com/p/first-weekly-premodern-league', by: 'swb mtg blog' },
      { name: 'TCGplayer beginner guide', url: 'https://www.tcgplayer.com/content/article/A-Beginner-s-Guide-to-Premodern-Magic-The-Gathering-s-Fastest-Growing-Fan-Format/630eb', by: 'TCGplayer', blurb: "An English-language on-ramp to the format." },
      { name: 'Ultimate Guard · Accumulating Premodern knowledge', url: 'https://ultimateguard.com/en/blog/accumulating-premodern-knowledge-magic-the-gathering', by: 'Ultimate Guard' },
    ],
  },
  {
    heading: 'Video creators',
    subtitle: 'Deck techs, gameplay, and event coverage.',
    links: [
      { name: 'Premodern MTGO', url: 'https://www.youtube.com/@PremodernMTGO', by: 'YouTube', blurb: 'Dedicated Premodern channel.' },
      { name: 'NeonMushroom', url: 'https://www.youtube.com/@neonmushroom6763', by: 'YouTube', blurb: 'Gameplay and deck techs.' },
      { name: 'Fluorescent Fungus', url: 'https://www.youtube.com/@FluorescentFungus', by: 'YouTube', blurb: 'Creator showdowns and gameplay.' },
      { name: 'BoshNRoll', url: 'https://www.youtube.com/@BoshNRoll', by: 'YouTube', blurb: 'Community-favorite Premodern creator.' },
      { name: 'StrataGames', url: 'https://www.youtube.com/@StrataGames', by: 'YouTube', blurb: 'Deck techs and gameplay (Jund, The Rock).' },
      { name: 'Cardmarket Magic', url: 'https://www.youtube.com/@cardmarket_magic', by: 'YouTube', blurb: 'Premodern gameplay with Andrea Mengucci.' },
      { name: 'The Stack', url: 'https://www.youtube.com/@TheStackMTG', by: 'YouTube', blurb: 'Gameplay and deck techs.' },
      { name: 'Crucible of Words', url: 'https://www.youtube.com/@CrucibleofWords', by: 'YouTube', blurb: 'Features Premodern creator showdowns.' },
      { name: 'I Play Magic', url: 'https://www.youtube.com/@IPlayMagic', by: 'Pj Priestly' },
      { name: 'Heavy Play', url: 'https://www.youtube.com/@HeavyPlay', by: 'YouTube' },
      { name: 'Duress Crew', url: 'https://www.youtube.com/@DuressCrew', by: 'YouTube' },
      { name: 'Impulse Crew', url: 'https://www.youtube.com/@ImpulseCrew', by: 'YouTube' },
      { name: 'Team Burrowing', url: 'https://www.youtube.com/@TeamBurrowing', by: 'YouTube' },
      { name: 'brightsdaymtg', url: 'https://www.youtube.com/@brightsdaymtg', by: 'YouTube' },
      { name: "Mengu's Workshop", url: 'https://www.youtube.com/@MenguWorkshop', by: 'Andrea Mengucci' },
      { name: 'LoadingReadyRun MTG', url: 'https://www.youtube.com/@LoadingReadyRun', by: 'YouTube', blurb: 'Includes Premodern Friday Night Paper Fight.' },
      { name: 'Tolarian Community College', url: 'https://www.youtube.com/@TolarianCommunityCollege', by: 'YouTube', blurb: 'Premodern intro episodes on a major MTG channel.' },
    ],
  },
  {
    heading: 'Follow along',
    subtitle: 'Official accounts and event series.',
    links: [
      { name: 'Premodern Magic (X)', url: 'https://x.com/premodernmagic', by: 'Official' },
      { name: 'Premodern Magic (Facebook)', url: 'https://www.facebook.com/premodernmagic/', by: 'Official' },
      { name: 'Premodern Magic (Instagram)', url: 'https://www.instagram.com/premodernmagic/', by: 'Official' },
      { name: 'Premodern MTGO (X)', url: 'https://x.com/PremodernMTGO', by: 'MTGO-focused updates' },
      { name: 'Community Premodern Series (X)', url: 'https://x.com/premodernseries', by: 'Organized play / series updates' },
    ],
  },
];

export default function CommunityPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl text-[var(--term-amber)] tracking-widest">
          &gt; COMMUNITY
        </h1>
        <p className="opacity-80 mt-2 max-w-3xl">
          Premodern is a small, passionate format. Here&apos;s a living index of
          where its players chat, organize events, publish articles, stream
          matches, and track results. If something&apos;s missing, let us know.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {SECTIONS.map((section) => (
          <section key={section.heading} className="panel">
            <h2 className="panel-heading">&gt; {section.heading}</h2>
            {section.subtitle ? (
              <p className="opacity-70 text-sm mb-3">{section.subtitle}</p>
            ) : null}
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.url} className="leading-snug">
                  <a href={link.url} target="_blank" rel="noreferrer" className="break-words">
                    {link.name}
                  </a>
                  {link.by ? (
                    <span className="opacity-55 text-sm"> · {link.by}</span>
                  ) : null}
                  {link.blurb ? (
                    <div className="opacity-70 text-sm">{link.blurb}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="panel mt-6">
        <h2 className="panel-heading">&gt; Contribute</h2>
        <p className="opacity-80 text-sm">
          Premodern Mentat aggregates tournament decks from MTGGoldfish and
          MTGTop8. If you run an event, stream Premodern, write about the
          format, or know of a resource missing from this page — reach out on
          the{' '}
          <a
            href="https://discord.com/invite/6FHPuFy"
            target="_blank"
            rel="noreferrer"
          >
            Premodern Discord
          </a>{' '}
          or open an issue on GitHub.
        </p>
      </section>
    </>
  );
}
