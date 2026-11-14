import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// The one place admin-written Markdown is turned into HTML — news articles and
// UCL campaign histories both render through here, so there is a single
// sanitisation policy to reason about.
//
// No "use client": it works in Server Components (the article page) and can be
// lazy-loaded into Client Components (the campaign panel) alike.

// Sanitize schema for the raw HTML that rehype-raw parses out of the Markdown.
// Keeps the default (safe) tag + URL-protocol allowlist — which drops
// <script>, event-handler attributes and javascript: URLs — but re-permits
// `className` and `style` so the editor's inline-styled accent spans still
// render. rehype-sanitize runs AFTER rehype-raw so it scrubs the parsed HTML.
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "style"],
  },
};

// Links that leave the site open in a new tab, so following a source doesn't
// throw away where the reader was. Applied after sanitising, in React.
function ExternalAwareLink({
  node,
  href,
  children,
  ...rest
}: ComponentProps<"a"> & { node?: unknown }) {
  // react-markdown hands every renderer the syntax-tree node; it is not a DOM
  // attribute, so keep it out of the spread below.
  void node;
  const external = typeof href === "string" && /^https?:\/\//i.test(href);
  return (
    <a
      {...rest}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export default function SafeMarkdown({
  children,
  externalLinksInNewTab = false,
}: {
  children: string;
  externalLinksInNewTab?: boolean;
}) {
  return (
    // remark-breaks turns a single newline (Enter in the editor) into a hard
    // <br>, so line breaks the admin types render on the live site instead of
    // being collapsed into a space by standard Markdown.
    <ReactMarkdown
      remarkPlugins={[remarkBreaks]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
      components={externalLinksInNewTab ? { a: ExternalAwareLink } : undefined}
    >
      {children}
    </ReactMarkdown>
  );
}
