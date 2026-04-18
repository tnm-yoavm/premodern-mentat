import Link from 'next/link';
import { scryfallNamedImage } from '@/lib/cards';

interface CardLinkProps {
  name: string;
  imageSmall?: string | null;
  imageNormal?: string | null;
  /** When true, renders the card name as a link to the card detail page. Default true. */
  linked?: boolean;
}

export function CardLink({ name, imageSmall, imageNormal, linked = true }: CardLinkProps) {
  const thumb = imageSmall || scryfallNamedImage(name, 'small');
  const large = imageNormal || scryfallNamedImage(name, 'normal');

  const inner = (
    <span className="card-cell">
      <span className="card-preview-wrap">
        <img className="card-thumb" src={thumb} alt="" loading="lazy" />
        <img className="card-preview" src={large} alt={name} loading="lazy" />
      </span>
      <span className="card-name">{name}</span>
    </span>
  );

  if (!linked) return inner;
  return <Link href={`/card/${encodeURIComponent(name)}`}>{inner}</Link>;
}
