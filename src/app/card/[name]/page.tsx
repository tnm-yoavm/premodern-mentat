import Link from 'next/link';
import { ColorPips } from '@/components/ColorPips';
import { parseColorIdentity, scryfallNamedImage, scryfallSearchUrl } from '@/lib/cards';
import { getCard, getCardArchetypes } from '@/lib/queries';

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { name } = await params;
  const cardName = decodeURIComponent(name);
  return {
    title: `${cardName} — Premodern Card`,
    description: `${cardName} in Premodern Magic: The Gathering — archetypes playing it, inclusion rates, and synergies.`,
  };
}

export default async function CardPage({ params }: Props) {
  const { name } = await params;
  const cardName = decodeURIComponent(name);
  const card = getCard(cardName);
  const archetypes = getCardArchetypes(cardName);

  const colors = parseColorIdentity(card?.color_identity);
  const imgUrl = card?.image_normal || scryfallNamedImage(cardName, 'normal');

  return (
    <>
      <div className="opacity-70 text-sm mb-2">
        <Link href="/">&lt; metagame</Link> / <span>{cardName}</span>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <div>
          <img
            src={imgUrl}
            alt={cardName}
            className="border border-[var(--term-green-dark)] w-full max-w-[240px]"
          />
          <a
            href={scryfallSearchUrl(cardName)}
            target="_blank"
            rel="noreferrer"
            className="block mt-2 text-sm"
          >
            View on Scryfall ↗
          </a>
        </div>

        <section>
          <h1 className="text-3xl text-[var(--term-amber)] flex items-center gap-3 flex-wrap">
            {cardName}
            <ColorPips colors={colors} />
          </h1>
          {card?.type_line ? (
            <p className="opacity-80 mt-1">{card.type_line}</p>
          ) : null}
          {card?.price_usd != null ? (
            <p className="opacity-70 mt-1">${card.price_usd.toFixed(2)} USD</p>
          ) : null}

          <h2 className="text-xl mt-6 mb-2 text-[var(--term-amber)] tracking-widest">
            &gt; Played in {archetypes.length} archetype{archetypes.length === 1 ? '' : 's'}
          </h2>

          {archetypes.length === 0 ? (
            <p className="opacity-70">
              No recorded mainboard appearances in the indexed decks.
            </p>
          ) : (
            <div className="panel">
              <table className="term-table">
                <thead>
                  <tr>
                    <th>Archetype</th>
                    <th className="w-24 text-right">Decks</th>
                    <th className="w-24 text-right">Inclusion</th>
                    <th className="w-20 text-right">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {archetypes.map((a) => (
                    <tr key={a.key}>
                      <td>
                        <Link href={`/archetype/${encodeURIComponent(a.key)}`}>
                          {a.display_name}
                        </Link>
                      </td>
                      <td className="text-right">{a.deck_count}</td>
                      <td className="text-right">{a.inclusion_pct.toFixed(1)}%</td>
                      <td className="text-right">{a.avg_copies.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
