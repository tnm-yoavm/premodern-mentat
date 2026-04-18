import { getBannedCards, getLegalSets } from '@/lib/queries';

export const metadata = {
  title: 'Format Info — Legal Sets & Banned Cards',
  description:
    'Premodern MTG format rules: legal sets from 4th Edition through Scourge, current banned & restricted list, and deck construction rules.',
};

export default function FormatPage() {
  const legalSets = getLegalSets();
  const banned = getBannedCards();

  return (
    <>
      <section className="mb-6">
        <h1 className="text-3xl md:text-4xl text-[var(--term-amber)] tracking-[0.1em]">
          &gt; Format Info
        </h1>
        <p className="opacity-80 mt-1 max-w-3xl">
          Premodern is an eternal constructed format using sets from 4th Edition (1995) through
          Scourge (2003). 60-card decks with a 15-card sideboard and a 4-copy limit on any non-basic card.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="panel">
          <div className="panel-heading">Legal Sets ({legalSets.length})</div>
          <table className="term-table">
            <thead>
              <tr>
                <th className="w-20">Code</th>
                <th>Name</th>
                <th className="w-28 text-right">Released</th>
              </tr>
            </thead>
            <tbody>
              {legalSets.map((s) => (
                <tr key={s.code}>
                  <td className="opacity-80">{s.code}</td>
                  <td>{s.name}</td>
                  <td className="text-right opacity-70">{s.released_at || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-heading">Banned &amp; Restricted ({banned.length})</div>
          <ul className="text-sm leading-relaxed">
            {banned.map((b) => (
              <li key={b.name} className="border-b border-dashed border-[var(--term-green-dark)] py-1.5">
                <span className="text-[var(--term-amber)]">{b.name}</span>
                <span className="opacity-70"> — {b.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
