/** Shared shimmer layout shown while a heavy route streams in. */
export default function PageSkeleton({ variant = "page" }: { variant?: "page" | "map" | "grid" | "panel" }) {
  return (
    <div className="bg-beige/25 pb-24 pt-32" aria-busy="true" aria-live="polite">
      <div className="shell">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton mt-5 h-10 w-2/3 max-w-xl rounded-lg" />
        <div className="skeleton mt-4 h-4 w-1/2 max-w-md rounded-full" />

        {variant === "map" && (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
            <div className="skeleton h-[62vh] min-h-[420px] rounded-2xl" />
            <div className="space-y-4">
              <div className="skeleton h-16 rounded-2xl" />
              <div className="skeleton h-64 rounded-2xl" />
            </div>
          </div>
        )}

        {variant === "grid" && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-2xl" />
            ))}
          </div>
        )}

        {variant === "panel" && (
          <>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-28 rounded-2xl" />
              ))}
            </div>
            <div className="skeleton mt-8 h-96 rounded-2xl" />
          </>
        )}

        {variant === "page" && (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-5">
              <div className="skeleton aspect-[16/10] rounded-2xl" />
              <div className="skeleton h-24 rounded-2xl" />
            </div>
            <div className="skeleton h-72 rounded-2xl" />
          </div>
        )}
      </div>
    </div>
  );
}
