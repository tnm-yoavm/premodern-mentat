import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CardLink } from '@/components/CardLink';
import { archetypeDisplay } from '@/lib/archetype-aliases';
import { getDeck } from '@/lib/queries';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const deck = getDeck(Number(id));
  if (!deck) return { title: 'Deck not found' };
  return {
    title: `${deck.deck.player || 'Deck'} — ${archetypeDisplay(deck.deck.archetype_key)}`,
    description: `${archetypeDisplay(deck.deck.archetype_key)} deck from ${deck.deck.event || 'unknown event'} (${deck.deck.date || 'undated'}). Full Premodern decklist.`,
  };
}

export default async function DeckPage({ params }: Props) {
  const { id } = await params;
  const data = getDeck(Number(id));
  if (!data) notFound();
  const { deck, mainboard, sideboard } = data;

  const mbCount = mainboard.reduce((s, c) => s + c.quantity, 0);
  const sbCount = sideboard.reduce((s, c) => s + c.quantity, 0);
  const mbValue = mainboard.reduce((s, c) => s + (c.price_usd ?? 0) * c.quantity, 0);
  const sbValue = sideboard.reduce((s, c) => s + (c.price_usd ?? 0) * c.quantity, 0);

  return (
    <>
      <div className="opacity-70 text-sm mb-2">
        <Link href="/">&lt; metagame</Link> /{' '}
        <Link href={`/archetype/${encodeURIComponent(deck.archetype_key)}`}>
          {archetypeDisplay(deck.archetype_key)}
        </Link>{' '}
        / <span>deck #{deck.id}</span>
      </div>

      <section className="mb-6">
        <h1 className="text-2xl md:text-3xl text-[var(--term-amber)]">
          {deck.player || 'Unknown player'} — {archetypeDisplay(deck.archetype_key)}
        </h1>
        <p className="opacity-80 mt-1">
          {deck.event || '—'} · {deck.date || '—'} · {deck.placement || '—'}
          {deck.source_url ? (
            <>
              {' '}
              ·{' '}
              <a href={deck.source_url} target="_blank" rel="noreferrer">
                {deck.source} ↗
              </a>
            </>
          ) : null}
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="panel">
          <div className="panel-heading">
            Mainboard ({mbCount}) {mbValue > 0 ? <span className="opacity-60 float-right">${mbValue.toFixed(2)}</span> : null}
          </div>
          <table className="term-table">
            <tbody>
              {mainboard.map((c) => (
                <tr key={`mb-${c.card_name}`}>
                  <td className="w-8 opacity-80">{c.quantity}</td>
                  <td>
                    <CardLink
                      name={c.card_name}
                      imageSmall={c.image_small}
                      imageNormal={c.image_normal}
                    />
                  </td>
                  <td className="text-right opacity-70 whitespace-nowrap">
                    {c.price_usd != null ? `$${c.price_usd.toFixed(2)}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-heading">
            Sideboard ({sbCount}){' '}
            {sbValue > 0 ? <span className="opacity-60 float-right">${sbValue.toFixed(2)}</span> : null}
          </div>
          {sideboard.length === 0 ? (
            <p className="opacity-60">No sideboard recorded.</p>
          ) : (
            <table className="term-table">
              <tbody>
                {sideboard.map((c) => (
                  <tr key={`sb-${c.card_name}`}>
                    <td className="w-8 opacity-80">{c.quantity}</td>
                    <td>
                      <CardLink
                        name={c.card_name}
                        imageSmall={c.image_small}
                        imageNormal={c.image_normal}
                      />
                    </td>
                    <td className="text-right opacity-70 whitespace-nowrap">
                      {c.price_usd != null ? `$${c.price_usd.toFixed(2)}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
