// Renders a JSON-LD structured-data block. Kept as a tiny shared component so
// every page injects schema the same (safe) way.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so a title/description containing "</script>" can't break out
      // of the script context. JSON.stringify drops `undefined` values for us.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
