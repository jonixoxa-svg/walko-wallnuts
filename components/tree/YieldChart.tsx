import type { Dict } from "@/lib/i18n";

export interface YieldPoint {
  year: number;
  kg: number;
  estimate?: boolean;
}

/**
 * Small SVG column chart. Recorded harvests are solid, the coming season is a
 * clearly marked estimate.
 */
export default function YieldChart({
  data,
  dict,
  height = 190,
}: {
  data: YieldPoint[];
  dict: Dict;
  height?: number;
}) {
  if (!data.length) {
    return <p className="text-[0.85rem] text-ink/55">{dict.tree.noHarvestYet}</p>;
  }

  const max = Math.max(...data.map((d) => d.kg), 5) * 1.15;
  const barWidth = 100 / (data.length * 1.6);
  const gap = barWidth * 0.6;

  return (
    <figure>
      <svg
        viewBox={`0 0 100 ${height / 3}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={dict.dashboard.production.title}
      >
        {[0.25, 0.5, 0.75, 1].map((line) => (
          <line
            key={line}
            x1="0"
            x2="100"
            y1={(height / 3) * (1 - line)}
            y2={(height / 3) * (1 - line)}
            stroke="currentColor"
            strokeWidth="0.15"
            className="text-walnut/20"
          />
        ))}
        {data.map((point, i) => {
          const h = (point.kg / max) * (height / 3);
          const x = i * (barWidth + gap) + gap / 2;
          return (
            <g key={point.year}>
              <rect
                x={x}
                y={height / 3 - h}
                width={barWidth}
                height={Math.max(h, 0.4)}
                rx="0.6"
                className={point.estimate ? "fill-gold/55" : "fill-forest"}
              >
                <title>
                  {point.year}: {point.kg} kg{point.estimate ? ` (${dict.common.estimate})` : ""}
                </title>
              </rect>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex justify-between text-[0.68rem] text-ink/50">
        {data.map((point) => (
          <span key={point.year} className="flex-1 text-center">
            <span className="block font-medium text-ink/75">{point.kg}</span>
            {point.year}
            {point.estimate ? "*" : ""}
          </span>
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-[0.7rem] text-ink/50">
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-sm bg-forest" /> {dict.dashboard.production.actualLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-sm bg-gold/60" /> * {dict.dashboard.production.estimateLabel}
        </span>
      </figcaption>
    </figure>
  );
}
