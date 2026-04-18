'use client';

import { useEffect, useState } from 'react';
import { COLOR_ORDER, type Color } from '@/lib/types';

interface ColorFilterProps {
  /** CSS selector matching `<tr>` elements that have a `data-colors="WUBRG..."` attribute. */
  rowSelector: string;
  /** Optional callback after applying the filter, receives the count of visible rows. */
  onApply?: (visibleCount: number) => void;
}

const LABELS: Record<Color, string> = {
  W: 'W',
  U: 'U',
  B: 'B',
  R: 'R',
  G: 'G',
};

export function ColorFilter({ rowSelector, onApply }: ColorFilterProps) {
  const [selected, setSelected] = useState<Set<Color>>(new Set());
  const [mode, setMode] = useState<'exact' | 'includes'>('includes');

  useEffect(() => {
    applyFilter();
  });

  function applyFilter() {
    if (typeof document === 'undefined') return;
    const rows = document.querySelectorAll<HTMLElement>(rowSelector);
    let visible = 0;
    let counter = 1;
    rows.forEach((row) => {
      const rowColors = (row.dataset.colors || '').split('');
      const colorsInRow = rowColors.filter((c) => 'WUBRG'.includes(c));
      const matchesIncludes = [...selected].every((c) => colorsInRow.includes(c));
      const matchesExact =
        selected.size === colorsInRow.length &&
        [...selected].every((c) => colorsInRow.includes(c));
      const show =
        selected.size === 0 || (mode === 'exact' ? matchesExact : matchesIncludes);
      row.style.display = show ? '' : 'none';
      if (show) {
        visible++;
        const rowNum = row.querySelector<HTMLElement>('[data-row-num]');
        if (rowNum) rowNum.textContent = String(counter++);
      }
    });
    onApply?.(visible);
  }

  function toggle(c: Color) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  return (
    <div className="flex flex-wrap items-center gap-2 my-3">
      <span className="opacity-70">&gt; filter:</span>
      {COLOR_ORDER.map((c) => (
        <button
          key={c}
          type="button"
          className={`term-btn ${selected.has(c) ? 'active' : ''}`}
          data-color={c}
          onClick={() => toggle(c)}
        >
          <span className={`pip ${c}`} aria-hidden />
          {LABELS[c]}
        </button>
      ))}
      <button
        type="button"
        className="term-btn"
        onClick={() => setMode(mode === 'exact' ? 'includes' : 'exact')}
        title={mode === 'exact' ? 'Match exactly these colors' : 'Match decks that include all selected colors'}
      >
        mode: {mode}
      </button>
      <button type="button" className="term-btn" onClick={clear}>
        [ clear ]
      </button>
    </div>
  );
}
