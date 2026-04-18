import type { Metadata } from 'next';
import { VT323 } from 'next/font/google';
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import './globals.css';

const vt323 = VT323({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-vt323',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Premodern Mentat — Premodern MTG Metagame & Deck Analytics',
    template: '%s | Premodern Mentat',
  },
  description:
    'Comprehensive metagame analytics, archetype breakdowns, deck lists, and format staples for the Premodern Magic: The Gathering format.',
  openGraph: {
    title: 'Premodern Mentat',
    description:
      'Premodern MTG metagame analytics — archetype breakdowns, tournament decks, and format staples from 9,900+ decks.',
    url: SITE_URL,
    siteName: 'Premodern Mentat',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Premodern Mentat' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={vt323.variable}>
      <head>
        {PLAUSIBLE_DOMAIN ? (
          <script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
      </head>
      <body>
        <header className="site-header">
          <div className="container-shell flex items-center justify-between gap-4 flex-wrap">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-2xl tracking-[0.25em] text-[var(--term-amber)]">
                PREMODERN
              </span>
              <span className="text-2xl tracking-[0.15em]">MENTAT</span>
              <span className="cursor-blink text-[var(--term-green-dim)]" aria-hidden />
            </Link>
            <SearchBar />
            <nav className="flex gap-4 text-sm md:text-base">
              <Link href="/">Metagame</Link>
              <Link href="/staples">Staples</Link>
              <Link href="/format">Format</Link>
              <Link href="/community">Community</Link>
              <Link href="/about">About</Link>
            </nav>
          </div>
        </header>

        <main className="container-shell py-6">{children}</main>

        <footer className="container-shell py-8 text-sm opacity-70 border-t border-[var(--term-green-dark)] mt-12">
          <div className="flex flex-wrap justify-between gap-4">
            <span>
              &gt; Premodern Mentat — built for the Premodern MTG community.
            </span>
            <span>
              Data:{' '}
              <a
                href="https://www.mtggoldfish.com/metagame/premodern"
                target="_blank"
                rel="noreferrer"
              >
                MTGGoldfish
              </a>{' '}
              &amp;{' '}
              <a href="https://mtgtop8.com/format?f=PREM" target="_blank" rel="noreferrer">
                MTGTop8
              </a>{' '}
              · Images:{' '}
              <a href="https://scryfall.com" target="_blank" rel="noreferrer">
                Scryfall
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
