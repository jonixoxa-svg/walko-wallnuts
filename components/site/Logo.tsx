/** Simple estate mark: a walnut half inside a ring. Easy to replace later. */
export default function Logo({ className = "", size = 30 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={`transition-colors ${className}`}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18.2" stroke="currentColor" strokeWidth="1.3" opacity="0.55" />
      <path
        d="M20 7.5c5.4 2.6 8.6 7.2 8.6 12.4 0 5.6-3.9 10.3-8.6 12.6-4.7-2.3-8.6-7-8.6-12.6 0-5.2 3.2-9.8 8.6-12.4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M20 8.4v23.5" stroke="currentColor" strokeWidth="1.1" opacity="0.75" />
      <path
        d="M20 13.6c-2.2 1-3.6 2.6-3.6 4.4M20 13.6c2.2 1 3.6 2.6 3.6 4.4M20 21c-2.6.9-4.3 2.6-4.6 4.9M20 21c2.6.9 4.3 2.6 4.6 4.9"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
