// Route-level loading UI for /shop — a premium skeleton that mirrors the real
// storefront layout (header, filter pills, 4-up product grid) shape-for-shape
// so the swap to live content causes zero layout shift.

// Skeleton primitives share the shimmer pulse and glass tone of the real cards.
function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-900/80 ${className ?? ""}`}
    />
  );
}

export default function ShopLoading() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        {/* Header skeleton — badge, headline, sub copy */}
        <header className="mb-8 max-w-3xl">
          <Bone className="h-8 w-40 rounded-full" />
          <Bone className="mt-5 h-12 w-full max-w-xl sm:h-14" />
          <Bone className="mt-4 h-5 w-full max-w-2xl" />
          <Bone className="mt-2 h-5 w-2/3" />
        </header>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>

        {/* Product grid — same responsive tracks and aspect ratio as the real
            cards so the reveal is seamless */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-md"
            >
              <div className="aspect-[4/5] w-full animate-pulse bg-zinc-900" />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <Bone className="h-4 w-4/5" />
                <Bone className="h-4 w-3/5" />
                <div className="mt-auto flex items-center justify-between pt-1">
                  <Bone className="h-6 w-20" />
                  <Bone className="h-4 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
