import Link from 'next/link';
import { CardLink } from '@/components/CardLink';
import { ColorFilter } from '@/components/ColorFilter';
import { getFormatStaples, getTotalDeckCount } from '@/lib/queries';

export const metadata = {
  title: 'Format Staples',
  description:
    'Cards that define Premodern Magic — ranked by the number of archetypes they appear in across thousands of tournament decks.',
};

export default function StaplesPage() {
  const staples = getFormatStaples(3, 200);
  const total = getTotalDeckCount();

  return (
    <>
      <section className="mb-4">
        <h1 className="text-3xl md:text-4xl text-[var(--term-amber)] tracking-[0.1em]">
          &gt; Format Staples
        </h1>
        <p className="opacity-80 mt-1">
          {staples.length} cards appearing in 3+ archetypes across {total.toLocaleString()} decks.
        </p>
      </section>

      <ColorFilter rowSelector="#staples-tbody tr" />

      <div className="panel">
        <table className="term-table">
          <thead>
            <tr>
              <th>Card</th>
              <th className="w-24 text-right">Archetypes</th>
              <th className="w-24 text-right">% of Decks</th>
              <th className="w-24 text-right">Avg Copies</th>
              <th>Played in</th>
            </tr>
          </thead>
          <tbody id="staples-tbody">
            {staples.map((s) => (
              <tr key={s.card_name} data-colors={s.colors.join('')}>
                <td>
                  <CardLink name={s.card_name} />
                </td>
                <td className="text-right">{s.archetype_count}</td>
                <td className="text-right">{s.deck_pct.toFixed(1)}%</td>
                <td className="text-right">{s.avg_copies.toFixed(1)}</td>
                <td className="opacity-80 text-sm">
                  {s.archetypes.slice(0, 6).map((a, i) => (
                    <span key={a.key}>
                      <Link href={`/archetype/${encodeURIComponent(a.key)}`}>{a.name}</Link>
                      {i < Math.min(5, s.archetypes.length - 1) ? ', ' : ''}
                    </span>
                  ))}
                  {s.archetypes.length > 6 ? (
                    <span className="opacity-60"> +{s.archetypes.length - 6}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
