"use client";

import { useEffect, useRef, useState } from "react";

/** Thin gold progress bar that fills once when scrolled into view. */
export default function Progress({
  value,
  label,
  className = "",
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setWidth(value);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setWidth(value);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className={className}>
      <div
        className="h-[6px] w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-walnut)_14%,transparent)]"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-forest via-forest-600 to-gold transition-[width] duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
