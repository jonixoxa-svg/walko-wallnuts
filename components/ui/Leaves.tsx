"use client";

import { useMemo } from "react";

const LEAF_PATH =
  "M12 2C7 5 3 9 3 14a7 7 0 0 0 11 5.7C18 17 21 12 21 6c0-1.4-.2-2.7-.6-4C17.6.9 14.4.6 12 2Z";

/** A handful of slow walnut leaves drifting across a section. Hidden for reduced motion. */
export default function Leaves({ count = 7, className = "" }: { count?: number; className?: string }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const r = seed / 233280;
        return {
          left: `${(r * 92 + 3).toFixed(2)}%`,
          delay: `${(r * 18).toFixed(1)}s`,
          duration: `${(16 + r * 16).toFixed(1)}s`,
          drift: `${Math.round((r - 0.5) * 180)}px`,
          scale: 0.6 + r * 0.9,
          opacity: 0.25 + r * 0.3,
        };
      }),
    [count]
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {leaves.map((leaf, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="leaf"
          style={{
            left: leaf.left,
            animationDelay: leaf.delay,
            animationDuration: leaf.duration,
            ["--drift" as string]: leaf.drift,
            transform: `scale(${leaf.scale})`,
            opacity: leaf.opacity,
          }}
        >
          <path d={LEAF_PATH} fill="#8a6b3d" />
        </svg>
      ))}
    </div>
  );
}
