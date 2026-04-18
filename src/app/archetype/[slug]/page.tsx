import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ColorPips } from '@/components/ColorPips';
import { CardLink } from '@/components/CardLink';
import {
  getArchetype,
  getArchetypeCardStats,
  getArchetypeDecks,
} from '@/lib/queries';
import type { ArchetypeCardStat } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const key = decodeURIComponent(slug);
  const arch = getArchetype(key);
  if (!arch) return { title: 'Archetype not found' };
  return {
    title: `${arch.display_name} — Premodern Archetype`,
    description: `${arch.display_name} deck lists, card inclusion rates, and metagame share (${arch.meta_pct.toFixed(1)}%, ${arch.deck_count} decks) in the Premodern MTG format.`,
  };
}

function StatRow({ stat }: { stat: ArchetypeCardStat }) {
  return (
    <tr>
      <td>
        <CardLink name={stat.card_name} />
      </td>
      <td className="text-right">{stat.inclusion_pct.toFixed(1)}%</td>
      <td className="text-right">{stat.avg_copies.toFixed(1)}</td>
      <td className="text-right opacity-70">{stat.deck_count}</td>
    </tr>
  );
}

function StatsTable({ title, rows }: { title: string; rows: ArchetypeCardStat[] }) {
  if (!rows.length) return null;
  return (
    <div className="panel">
      <div className="panel-heading">{title} ({rows.length})</div>
      <table className="term-table">
        <thead>
          <tr>
            <th>Card</th>
            <th className="w-24 text-right">Inclusion</th>
            <th className="w-20 text-right">Avg</th>
            <th className="w-16 text-right opacity-70">Decks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <StatRow key={`${r.section}-${r.card_name}`} stat={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ArchetypePage({ params }: Props) {
  const { slug } = await params;
  const key = decodeURIComponent(slug);
  const arch = getArchetype(key);
  if (!arch) notFound();

  const stats = getArchetypeCardStats(key);
  const decks = getArchetypeDecks(key, 100);

  return (
    <>
      <div className="opacity-70 text-sm mb-2">
        <Link href="/">&lt; metagame</Link> / <span>{arch.display_name}</span>
      </div>

      <section className="mb-6">
        <h1 className="text-3xl md:text-4xl text-[var(--term-amber)] tracking-[0.1em] flex items-center gap-3 flex-wrap">
          <span>{arch.display_name}</span>
          <ColorPips colors={arch.colors} />
        </h1>
        <p className="opacity-80 mt-1">
          {arch.deck_count.toLocaleString()} decks · {arch.meta_pct.toFixed(1)}% of metagame
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <StatsTable title="Mainboard — Spells" rows={stats.mainboard_spells.slice(0, 60)} />
        <StatsTable title="Mainboard — Lands" rows={stats.mainboard_lands.slice(0, 30)} />
      </div>

      <div className="mt-6">
        <StatsTable title="Sideboard" rows={stats.sideboard.slice(0, 40)} />
      </div>

      <section className="mt-8">
        <h2 className="text-xl text-[var(--term-amber)] tracking-widest mb-2">
          &gt; Recent Decks ({decks.length})
        </h2>
        <div className="panel">
          <table className="term-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Player</th>
                <th>Event</th>
                <th className="w-20">Rank</th>
                <th className="w-24 text-right">Source</th>
              </tr>
            </thead>
            <tbody>
              {decks.map((d) => (
                <tr key={d.deck_id}>
                  <td className="opacity-80 whitespace-nowrap">{d.date || '—'}</td>
                  <td>
                    <Link href={`/deck/${d.deck_id}`}>{d.player || 'unknown'}</Link>
                  </td>
                  <td className="opacity-80 truncate max-w-[360px]">{d.event}</td>
                  <td className="opacity-90">{d.placement || '—'}</td>
                  <td className="text-right">
                    {d.source_url ? (
                      <a href={d.source_url} target="_blank" rel="noreferrer">
                        {d.source || 'link'} ↗
                      </a>
                    ) : (
                      d.source || '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
