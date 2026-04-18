import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'term-bg': '#0a0a0a',
        'term-bg-light': '#111111',
        'term-green': '#00ff41',
        'term-green-dim': '#00cc33',
        'term-green-dark': '#009922',
        'term-amber': '#ffaa00',
        'term-red': '#ff4444',
        'mtg-w': '#f8e7b9',
        'mtg-u': '#b3ceea',
        'mtg-b': '#a69f9d',
        'mtg-r': '#eb9f82',
        'mtg-g': '#c4d3ca',
      },
      fontFamily: {
        mono: ['var(--font-vt323)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['var(--font-vt323)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'term-glow': '0 0 12px rgba(0, 255, 65, 0.35)',
        'term-amber-glow': '0 0 12px rgba(255, 170, 0, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
