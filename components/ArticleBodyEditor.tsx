"use client";

import { useRef } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, TriangleAlert } from "lucide-react";

// Same unsigned preset used by the cover-image uploader. next-cloudinary also
// needs NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (read internally).
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// The article body editor: a Markdown <textarea> plus an "Insert Image" button
// that uploads to Cloudinary and drops `![Article Image](secure_url)` into the
// content at the caret (falling back to the end of the text). Shared by the New
// and Edit article forms so both behave identically.
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
          Content{" "}
          <span className="font-normal text-midnight-900/40">(Markdown)</span>
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
                className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-gold-500/5 px-4 py-2 text-sm font-semibold text-gold-700 transition-all duration-300 hover:bg-gold-500/15 hover:shadow-[0_0_22px_-10px_rgba(212,175,55,0.9)]"
              >
                <ImagePlus className="h-4 w-4" />
                🖼️ Insert Image into Article
              </button>
            )}
          </CldUploadWidget>
        ) : null}
      </div>

      <textarea
        id="content"
        ref={textareaRef}
        required
        rows={14}
        value={content}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write the story… Separate paragraphs with a blank line. Use the button above to drop images anywhere."
        className={`${inputClass} resize-y leading-relaxed`}
      />

      {UPLOAD_PRESET ? (
        <p className="text-xs text-midnight-900/50">
          Uploaded images are inserted as Markdown at your cursor and render
          inline in the published article.
        </p>
      ) : (
        <p className="flex items-center gap-2 text-xs text-amber-700">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
          Inline image upload is unavailable — set{" "}
          <code className="font-mono">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code>{" "}
          to enable it. You can still paste Markdown image syntax manually.
        </p>
      )}
    </div>
  );
}
