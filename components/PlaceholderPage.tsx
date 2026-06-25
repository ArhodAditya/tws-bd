import type { LucideIcon } from "lucide-react";

type PlaceholderPageProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export default function PlaceholderPage({
  icon: Icon,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-midnight-950 px-4 text-center text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center">
        <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-500/30 bg-gold-500/10 text-gold-400">
          <Icon className="h-8 w-8" />
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-zinc-400">{description}</p>
        <span className="mt-6 inline-block rounded-full border border-gold-500/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
          Coming Soon
        </span>
      </div>
    </section>
  );
}
