"use client";

import { useRef, type ComponentType } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Bold, ImagePlus, Palette, TriangleAlert, Type } from "lucide-react";

// Same unsigned preset used by the cover-image uploader. next-cloudinary also
// needs NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (read internally).
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// The three style shortcuts surfaced in the toolbar. Each wraps the current
// selection (or a "Text" placeholder at the caret) in Markdown / inline HTML —
// the article page compiles the HTML via rehype-raw.
const STYLE_ACTIONS: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  before: string;
  after: string;
}[] = [
  { label: "Bold Text", icon: Bold, before: "**", after: "**" },
  {
    label: "Gold Brand Color",
    icon: Palette,
    before: '<span style="color: #fbbf24;">',
    after: "</span>",
  },
  {
    label: "Cursive Editorial Font",
    icon: Type,
    before: '<span style="font-family: cursive;">',
    after: "</span>",
  },
];

// Minimal toolbar button with a sleek micro-tooltip that fades in above it.
function ToolbarButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-all duration-300 ease-out hover:bg-zinc-800/80 hover:text-amber-400 active:scale-[0.98]"
    >
      <Icon className="h-4 w-4" />
      <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-800/80 bg-zinc-950/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-300 opacity-0 shadow-xl backdrop-blur-md transition-all duration-300 ease-out group-hover:opacity-100"
      >
        {label}
      </span>
    </button>
  );
}

// The article body editor: a Markdown <textarea> plus a style-shortcut toolbar
// and an "Insert Image" button that uploads to Cloudinary and drops
// `![Article Image](secure_url)` into the content at the caret (falling back
// to the end of the text). Shared by the New and Edit article forms so both
// behave identically.
export default function ArticleBodyEditor({
  content,
  onChange,
  inputClass,
  labelClass,
}: {
  content: string;
  onChange: (value: string) => void;
  inputClass: string;
  labelClass: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Wrap the live selection in the given markers without disturbing the rest
  // of the text. With a collapsed caret a "Text" placeholder is injected and
  // pre-selected so the admin can immediately type over it.
  const wrapSelection = (before: string, after: string) => {
    const el = textareaRef.current;

    // No textarea handle (shouldn't happen) → append a template to the end.
    if (!el) {
      onChange(`${content}${before}Text${after}`);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = el.value;
    const selected = value.slice(start, end) || "Text";
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;

    onChange(next);

    // Restore focus and select the wrapped text once React commits, so the
    // admin can keep typing (or re-style) without reaching for the mouse.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  };

  const insertImageMarkdown = (url: string) => {
    const snippet = `![Article Image](${url})`;
    const el = textareaRef.current;

    // No textarea handle (shouldn't happen) → just append to the end.
    if (!el) {
      onChange(content ? `${content}\n\n${snippet}\n` : `${snippet}\n`);
      return;
    }

    // Splice at the live caret. Pad with blank lines so the image is its own
    // Markdown block and doesn't fuse with surrounding paragraphs.
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = el.value;
    const before = value.slice(0, start);
    const after = value.slice(end);

    const left =
      before.length === 0 || before.endsWith("\n\n") ? before : `${before}\n\n`;
    const right =
      after.length === 0 ? "\n" : after.startsWith("\n\n") ? after : `\n\n${after}`;
    const next = `${left}${snippet}${right}`;
    const caret = left.length + snippet.length;

    onChange(next);

    // Restore focus + caret just past the inserted image once React commits.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="content" className={labelClass}>
          Content <span className="font-normal text-zinc-500">(Markdown)</span>
        </label>

        {UPLOAD_PRESET ? (
          <CldUploadWidget
            uploadPreset={UPLOAD_PRESET}
            options={{ multiple: false, sources: ["local", "url", "camera"] }}
            onSuccess={(result) => {
              const info = result?.info;
              if (info && typeof info === "object" && "secure_url" in info) {
                const url = (info as { secure_url?: string }).secure_url;
                if (url) insertImageMarkdown(url);
              }
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-gold-500/10 px-4 py-2 text-sm font-semibold text-gold-300 transition-all duration-300 ease-out hover:bg-gold-500/20 hover:shadow-[0_0_22px_-10px_rgba(212,175,55,0.9)] active:scale-[0.98]"
              >
                <ImagePlus className="h-4 w-4" />
                🖼️ Insert Image into Article
              </button>
            )}
          </CldUploadWidget>
        ) : null}
      </div>

      {/* Style shortcuts — inject Markdown / inline-HTML wrappers around the
          live selection (rendered on the site through rehype-raw). */}
      <div className="inline-flex items-center gap-1 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-1 backdrop-blur-md">
        {STYLE_ACTIONS.map((action) => (
          <ToolbarButton
            key={action.label}
            label={action.label}
            icon={action.icon}
            onClick={() => wrapSelection(action.before, action.after)}
          />
        ))}
      </div>

      <textarea
        id="content"
        ref={textareaRef}
        required
        rows={14}
        value={content}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write the story… Separate paragraphs with a blank line. Use the buttons above to style text and drop images anywhere."
        className={`${inputClass} resize-y leading-relaxed`}
      />

      {UPLOAD_PRESET ? (
        <p className="text-xs text-zinc-500">
          Uploaded images are inserted as Markdown at your cursor and render
          inline in the published article.
        </p>
      ) : (
        <p className="flex items-center gap-2 text-xs text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
          Inline image upload is unavailable — set{" "}
          <code className="font-mono">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>{" "}
          to enable it. You can still paste Markdown image syntax manually.
        </p>
      )}
    </div>
  );
}
