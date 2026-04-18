'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchHit } from '@/lib/queries';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced fetch.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data: { hits: SearchHit[] }) => {
          setHits(data.hits || []);
          setActive(0);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if ((err as { name?: string })?.name !== 'AbortError') setLoading(false);
        });
    }, 150);
    return () => clearTimeout(handle);
  }, [query]);

  // Close when clicking outside.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function go(hit: SearchHit) {
    setOpen(false);
    setQuery('');
    setHits([]);
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) {
      if (e.key === 'Enter' && query.trim().length >= 2) {
        // Fallback: go to the card page for the typed text.
        router.push(`/card/${encodeURIComponent(query.trim())}`);
        setOpen(false);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + hits.length) % hits.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[active];
      if (hit) go(hit);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={wrapRef} className="search-wrap">
      <input
        type="text"
        placeholder="> search cards / archetypes"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="search-input"
        autoComplete="off"
        spellCheck={false}
        aria-label="Search cards and archetypes"
      />
      {showDropdown ? (
        <div className="search-dropdown" role="listbox">
          {loading && hits.length === 0 ? (
            <div className="search-empty">searching…</div>
          ) : hits.length === 0 ? (
            <div className="search-empty">no matches</div>
          ) : (
            hits.map((hit, i) => {
              const label = hit.kind === 'card' ? hit.name : hit.display_name;
              const sub =
                hit.kind === 'card'
                  ? hit.type_line || 'card'
                  : `archetype · ${hit.deck_count} deck${hit.deck_count === 1 ? '' : 's'}`;
              return (
                <button
                  key={`${hit.kind}:${hit.kind === 'card' ? hit.name : hit.key}`}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={`search-option ${i === active ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    // prevent input blur before navigation
                    e.preventDefault();
                    go(hit);
                  }}
                >
                  <span className={`search-tag tag-${hit.kind}`}>{hit.kind}</span>
                  <span className="search-label">{label}</span>
                  <span className="search-sub">{sub}</span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
