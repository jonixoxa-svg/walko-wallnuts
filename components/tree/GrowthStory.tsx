import Photo from "@/components/ui/Photo";
import type { Dict } from "@/lib/i18n";
import type { Phase, Tree } from "@/lib/model";
import { pick } from "@/lib/photos";

const STAGES: { phase: Phase; season: "winter" | "spring" | "summer" | "autumn"; themes: string[]; months: [string, string] }[] = [
  { phase: "dormant", season: "winter", themes: ["winter", "care"], months: ["December", "Dezember"] },
  { phase: "blooming", season: "spring", themes: ["spring", "detail"], months: ["April", "April"] },
  { phase: "growing", season: "summer", themes: ["fruit", "tree"], months: ["June", "Juni"] },
  { phase: "ripening", season: "autumn", themes: ["fruit", "nuts"], months: ["September", "September"] },
  { phase: "harvested", season: "autumn", themes: ["harvest", "nuts"], months: ["October", "Oktober"] },
];

const ORDER: Phase[] = ["dormant", "blooming", "growing", "ripening", "harvested"];

/**
 * Idea 3 — the seasonal growth story: the same tree from bare winter wood to the
 * drying floor, with the stage it is in right now marked.
 */
export default function GrowthStory({
  tree,
  dict,
  locale,
}: {
  tree: Tree;
  dict: Dict;
  locale: "en" | "de";
}) {
  const current = ORDER.indexOf(tree.phase);

  return (
    <div>
      <div className="scrollbar-thin -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-3 md:mx-0 md:px-0">
        {STAGES.map((stage, i) => {
          const own = [...tree.photos].reverse().find((p) => p.season === stage.season);
          const src = own?.src ?? pick(stage.themes[0], tree.n + i * 11).src;
          const done = i < current;
          const active = i === current;

          return (
            <figure
              key={stage.phase}
              className={`w-[74vw] shrink-0 snap-start sm:w-[46vw] lg:w-[calc((100%-3rem)/4)] ${
                active ? "" : "opacity-95"
              }`}
            >
              <div
                className={`overflow-hidden rounded-xl border transition-shadow ${
                  active ? "border-gold shadow-[0_18px_40px_-30px_rgba(198,161,91,0.9)]" : "border-walnut/12"
                }`}
              >
                <Photo
                  src={src}
                  alt={`${dict.phases[stage.phase]} — ${tree.code}`}
                  className="aspect-[4/3]"
                  imgClassName={done || active ? "" : "saturate-[0.75]"}
                  sizes="(max-width: 640px) 74vw, (max-width: 1024px) 46vw, 24vw"
                />
                <div className="bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-[0.7rem] uppercase tracking-[0.16em] ${
                        active ? "text-gold" : "text-ink/45"
                      }`}
                    >
                      {stage.months[locale === "de" ? 1 : 0]}
                    </p>
                    {active && (
                      <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.62rem] uppercase tracking-wider text-walnut-900">
                        {locale === "de" ? "Jetzt" : "Now"}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 font-display text-lg text-ink">{dict.phases[stage.phase]}</h3>
                  <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink/60">{dict.phaseNotes[stage.phase]}</p>
                </div>
              </div>
            </figure>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
        {ORDER.map((phase, i) => (
          <span
            key={phase}
            className={`h-1 flex-1 rounded-full ${
              i < current ? "bg-forest/70" : i === current ? "bg-gold" : "bg-walnut/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
