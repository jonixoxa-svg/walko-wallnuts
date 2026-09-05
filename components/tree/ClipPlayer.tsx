import { Film } from "lucide-react";
import type { Clip } from "@/lib/model";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site";

/**
 * Renders orchard footage when the estate has any. Files live in
 * `public/videos/`; without them the block explains that photographs carry the
 * record instead — no empty player, no placeholder frame.
 */
export default function ClipPlayer({
  clips,
  dict,
  locale,
  compact = false,
}: {
  clips?: Clip[];
  dict: Dict;
  locale: Locale;
  compact?: boolean;
}) {
  if (!clips?.length) {
    return compact ? null : (
      <p className="flex items-start gap-2 text-[0.82rem] leading-relaxed text-ink/50">
        <Film size={15} className="mt-0.5 shrink-0" />
        {dict.tree.videoNone}
      </p>
    );
  }

  return (
    <div className={compact ? "" : "grid gap-4 sm:grid-cols-2"}>
      {clips.map((clip) => (
        <figure key={clip.src}>
          <video
            controls
            preload="none"
            playsInline
            poster={clip.poster}
            className="aspect-video w-full rounded-xl bg-forest-900 object-cover"
          >
            <source src={clip.src} type={clip.src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
          </video>
          <figcaption className="mt-2 text-[0.76rem] text-ink/55">
            {(locale === "de" ? clip.labelDe : clip.labelEn) ??
              `${dict.gallery.seasons[clip.season]} ${clip.year}`}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
