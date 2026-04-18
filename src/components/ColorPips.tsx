import { COLOR_ORDER, type Color } from '@/lib/types';

const NAMES: Record<Color, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
};

export function ColorPips({ colors }: { colors: Color[] | string[] }) {
  const ordered = COLOR_ORDER.filter((c) => colors.includes(c));
  return (
    <span className="color-pips">
      {ordered.map((c) => (
        <span key={c} className={`pip ${c}`} title={NAMES[c]} />
      ))}
    </span>
  );
}
