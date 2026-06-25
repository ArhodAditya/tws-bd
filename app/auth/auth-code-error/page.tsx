import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-midnight-950 px-4 text-center text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center">
        <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-500/30 bg-gold-500/10 text-gold-400">
          <TriangleAlert className="h-8 w-8" />
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Sign-in Failed
        </h1>
        <p className="mt-4 max-w-md text-zinc-400">
          We couldn&apos;t complete your Google sign-in. The link may have
          expired — please head back and try again.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03]"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
