"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Save } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import ArticleBodyEditor from "@/components/ArticleBodyEditor";
import {
  createUclCampaign,
  updateUclCampaign,
} from "@/app/admin/actions/ucl-campaigns";
import {
  CAMPAIGN_YEAR_RANGE,
  HISTORY_MAX_CHARS,
  countWords,
  normalizeCampaignInput,
  type UclCampaign,
} from "@/lib/ucl-campaigns";

// Create / edit form for one UCL campaign. With a `campaign` it edits that row;
// without one it adds a new title (the sixteenth, one day).
//
// Saves go through the admin-gated Server Actions — `ucl_campaigns` has no
// write policies, so the browser client couldn't write to it even if it tried.
export default function UclCampaignForm({
  campaign,
}: {
  campaign?: UclCampaign;
}) {
  const router = useRouter();
  const isEdit = campaign !== undefined;

  // Numbers are held as text so a half-typed "-" or "48." isn't fought by the
  // input; they are parsed (and range-checked) on submit.
  const [year, setYear] = useState(campaign ? String(campaign.year) : "");
  const [city, setCity] = useState(campaign?.city ?? "");
  const [lat, setLat] = useState(campaign ? String(campaign.lat) : "");
  const [lng, setLng] = useState(campaign ? String(campaign.lng) : "");
  const [title, setTitle] = useState(campaign?.title ?? "");
  const [opponent, setOpponent] = useState(campaign?.opponent ?? "");
  const [score, setScore] = useState(campaign?.score ?? "");
  const [heroes, setHeroes] = useState(campaign?.heroes ?? "");
  const [route, setRoute] = useState(campaign?.route ?? "");
  const [imageUrl, setImageUrl] = useState(campaign?.image_url ?? "");
  const [history, setHistory] = useState(campaign?.detailed_history ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyChars = history.trim().length;
  const historyTooLong = historyChars > HISTORY_MAX_CHARS;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Same rules the Server Action enforces — checked here first only so a
    // mistake doesn't cost a round-trip. An empty number field becomes NaN and
    // is reported as out of range.
    const parsed = normalizeCampaignInput({
      year: year.trim() === "" ? Number.NaN : Number(year),
      city,
      lat: lat.trim() === "" ? Number.NaN : Number(lat),
      lng: lng.trim() === "" ? Number.NaN : Number(lng),
      title,
      opponent,
      score,
      heroes,
      route,
      detailed_history: history,
      image_url: imageUrl,
    });
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    setLoading(true);
    const result = isEdit
      ? await updateUclCampaign(campaign.id, parsed.value)
      : await createUclCampaign(parsed.value);

    if (!result.success) {
      setError(result.message ?? "The campaign could not be saved.");
      setLoading(false);
      return;
    }

    // Back to the list. `loading` stays true so the button remains disabled
    // while the navigation happens.
    router.push("/admin/ucl-history");
    router.refresh();
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-4 py-2.5 text-white shadow-sm outline-none transition placeholder:text-zinc-600 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30";
  const labelClass = "block text-sm font-semibold text-white";
  const hintClass = "text-xs text-zinc-500";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-md sm:p-8"
    >
      {/* Year + City */}
      <div className="grid gap-6 sm:grid-cols-[10rem_1fr]">
        <div className="space-y-2">
          <label htmlFor="campaign-year" className={labelClass}>
            Year
          </label>
          <input
            id="campaign-year"
            type="number"
            inputMode="numeric"
            min={CAMPAIGN_YEAR_RANGE.min}
            max={CAMPAIGN_YEAR_RANGE.max}
            step={1}
            value={year}
            onChange={(event) => setYear(event.target.value)}
            placeholder="2024"
            className={inputClass}
          />
          <p className={hintClass}>The year the final was played.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="campaign-city" className={labelClass}>
            Host city
          </label>
          <input
            id="campaign-city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="London"
            className={inputClass}
          />
          <p className={hintClass}>
            Finals in the same city share one beacon on the globe, so spell it
            the same way each time.
          </p>
        </div>
      </div>

      {/* Coordinates */}
      <div className="space-y-2">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="campaign-lat" className={labelClass}>
              Latitude
            </label>
            <input
              id="campaign-lat"
              type="number"
              inputMode="decimal"
              min={-90}
              max={90}
              step="any"
              value={lat}
              onChange={(event) => setLat(event.target.value)}
              placeholder="51.5560"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="campaign-lng" className={labelClass}>
              Longitude
            </label>
            <input
              id="campaign-lng"
              type="number"
              inputMode="decimal"
              min={-180}
              max={180}
              step="any"
              value={lng}
              onChange={(event) => setLng(event.target.value)}
              placeholder="-0.2795"
              className={inputClass}
            />
          </div>
        </div>
        <p className={hintClass}>
          The stadium&apos;s position in decimal degrees — west and south are
          negative. In Google Maps, right-click the stadium to copy both.
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="campaign-title" className={labelClass}>
          Title
        </label>
        <input
          id="campaign-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="La Quince"
          className={inputClass}
        />
        <p className={hintClass}>The name the win is remembered by.</p>
      </div>

      {/* Opponent + Score */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="campaign-opponent" className={labelClass}>
            Opponent in the final
          </label>
          <input
            id="campaign-opponent"
            type="text"
            value={opponent}
            onChange={(event) => setOpponent(event.target.value)}
            placeholder="Borussia Dortmund"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="campaign-score" className={labelClass}>
            Score
          </label>
          <input
            id="campaign-score"
            type="text"
            value={score}
            onChange={(event) => setScore(event.target.value)}
            placeholder="2-0"
            className={inputClass}
          />
          <p className={hintClass}>
            Real Madrid&apos;s goals first. Add how it was settled in brackets:{" "}
            <span className="text-zinc-300">3-2 (aet)</span>,{" "}
            <span className="text-zinc-300">1-1 (5-3 pens)</span>.
          </p>
        </div>
      </div>

      {/* Heroes */}
      <div className="space-y-2">
        <label htmlFor="campaign-heroes" className={labelClass}>
          Heroes <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <textarea
          id="campaign-heroes"
          rows={2}
          value={heroes}
          onChange={(event) => setHeroes(event.target.value)}
          placeholder="Dani Carvajal, Vinícius Júnior, Toni Kroos in his final match for the club"
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <p className={hintClass}>
          The players and coaches who decided the final.
        </p>
      </div>

      {/* Route */}
      <div className="space-y-2">
        <label htmlFor="campaign-route" className={labelClass}>
          Route to the final{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <textarea
          id="campaign-route"
          rows={5}
          value={route}
          onChange={(event) => setRoute(event.target.value)}
          placeholder={
            "Group stage: winners of Group C\nRound of 16: RB Leipzig, 2–1 on aggregate\nQuarter-final: Manchester City, 4–4 on aggregate, 4–3 on penalties\nSemi-final: Bayern Munich, 4–3 on aggregate"
          }
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <p className={hintClass}>
          One round per line — each line becomes a step on the Fans Zone panel.
        </p>
      </div>

      {/* Photo */}
      <div className="space-y-2">
        <span className={labelClass}>
          Photo of the final{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </span>
        <ImageUploader
          multiple={false}
          value={imageUrl ? [imageUrl] : []}
          onChange={(action) =>
            setImageUrl((prev) => {
              const next =
                typeof action === "function"
                  ? action(prev ? [prev] : [])
                  : action;
              return next[0] ?? "";
            })
          }
        />
        <p className={hintClass}>
          Shown as the wide banner at the top of the campaign&apos;s panel. A
          landscape photo works best.
        </p>
      </div>

      {/* Detailed history */}
      <div className="space-y-2">
        <ArticleBodyEditor
          id="campaign-history"
          label="Detailed history"
          required={false}
          rows={24}
          content={history}
          onChange={setHistory}
          inputClass={inputClass}
          labelClass={labelClass}
          placeholder="Tell the whole story of the campaign — the group stage, the knockout ties, the final. Paste as much as you like; separate paragraphs with a blank line. Start a line with ## for a section heading."
          insertImageLabel="Insert image into the history"
          imageAlt="Campaign photo"
          hint="Markdown is supported: ## headings, **bold**, lists and links. Images you insert here appear inline in the story."
        />
        <p
          className={`text-xs tabular-nums ${
            historyTooLong ? "font-semibold text-red-400" : "text-zinc-500"
          }`}
          role={historyTooLong ? "alert" : undefined}
        >
          {countWords(history).toLocaleString("en-US")} words ·{" "}
          {historyChars.toLocaleString("en-US")} of{" "}
          {HISTORY_MAX_CHARS.toLocaleString("en-US")} characters
          {historyTooLong ? " — too long to save" : ""}
        </p>
      </div>

      {/* Error */}
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      {/* Actions */}
      <div className="flex flex-col-reverse items-stretch gap-4 border-t border-zinc-800/50 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={loading || historyTooLong}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : isEdit ? (
            <>
              <Save className="h-4 w-4" />
              Save campaign
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add campaign
            </>
          )}
        </button>
      </div>
    </form>
  );
}
