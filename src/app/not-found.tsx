import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl text-[var(--term-amber)] tracking-widest">404 / NOT FOUND</h1>
      <p className="opacity-80 mt-3">The card you're looking for was sent to the graveyard.</p>
      <p className="mt-6">
        <Link href="/">&gt; return to metagame</Link>
      </p>
    </div>
  );
}
