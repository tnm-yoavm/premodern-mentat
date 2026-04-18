import Link from 'next/link';
import { ColorPips } from '@/components/ColorPips';
import { ColorFilter } from '@/components/ColorFilter';
import { getArchetypes, getTotalDeckCount } from '@/lib/queries';

export const metadata = {
  title: 'Premodern Metagame',
  description:
    'Live metagame breakdown of the Premodern MTG format. Archetype deck counts, meta percentages, and color identities across 9,900+ tournament decks.',
};

export default function HomePage() {
  const archetypes = getArchetypes();
  const totalDecks = getTotalDeckCount();

  // Scale meta % bar so the largest archetype fills most of the column.
  const maxPct = archetypes.reduce((m, a) => Math.max(m, a.meta_pct), 0) || 1;

  return (
    <>
      <section className="mb-4">
        <h1 className="text-3xl md:text-4xl text-[var(--term-amber)] tracking-[0.15em]">
          &gt; Premodern Metagame
        </h1>
        <p className="opacity-80 mt-1">
          {archetypes.length} archetypes · {totalDecks.toLocaleString()} decks indexed from MTGGoldfish &amp; MTGTop8
        </p>
      </section>

      <ColorFilter rowSelector="#arch-tbody tr" />

      <div className="panel">
        <table className="term-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Archetype</th>
              <th className="w-[110px]">Colors</th>
              <th className="w-20 text-right">Decks</th>
              <th className="w-[260px]">Meta %</th>
            </tr>
          </thead>
          <tbody id="arch-tbody">
            {archetypes.map((a, i) => (
              <tr key={a.key} data-colors={a.colors.join('')}>
                <td data-row-num className="opacity-60">{i + 1}</td>
                <td>
                  <Link href={`/archetype/${encodeURIComponent(a.key)}`}>
                    {a.display_name || a.key}
                  </Link>
                </td>
                <td>
                  <ColorPips colors={a.colors} />
                </td>
                <td className="text-right">{a.deck_count.toLocaleString()}</td>
                <td>
                  <span
                    className="meta-bar"
                    style={{ width: `${Math.max(4, (a.meta_pct / maxPct) * 200)}px` }}
                  />
                  <span className="opacity-90">{a.meta_pct.toFixed(1)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
