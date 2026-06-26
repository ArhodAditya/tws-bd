import type { ReactNode } from "react";

// Shared chrome + typography for the static legal pages (Privacy, Terms) so they
// read identically. Theme-aware (premium in dark mode, still legible in light)
// using the site's slate/zinc + gold conventions rather than hardcoded grays.

export default function LegalPageShell({
  title,
  lastUpdated,
  intro,
  children,
}: {
  title: string;
  lastUpdated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-slate-50 text-slate-900 dark:bg-midnight-950 dark:text-white">
      {/* Ambient gold glow, matching the rest of the brand surfaces */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="border-b border-gray-200 pb-8 dark:border-white/10">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-300">
            The Whites Stories
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
            Last Updated: {lastUpdated}
          </p>
        </header>

        <p className="mt-8 text-lg leading-relaxed text-slate-600 dark:text-zinc-300">
          {intro}
        </p>

        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </div>
  );
}

// A titled section: `<h2>` + its body content.
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="text-base leading-relaxed text-slate-600 dark:text-zinc-300">
      {children}
    </p>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-600 marker:text-gold-500 dark:text-zinc-300">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
