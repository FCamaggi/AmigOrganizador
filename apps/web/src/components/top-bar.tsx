import Link from "next/link";

/** Back link on the left, a short context line on the right. */
export function TopBar({
  backHref,
  backLabel,
  aside,
}: {
  readonly backHref: string;
  readonly backLabel: string;
  readonly aside?: string;
}) {
  return (
    <nav className="flex items-center justify-between font-bold text-sm">
      <Link
        href={backHref}
        className="-ml-2 flex min-h-11 items-center px-2 text-line-blue no-underline"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="mr-0.5 size-4">
          <path
            d="M10 3 5 8l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {backLabel}
      </Link>
      {aside ? <span className="truncate pl-3 text-ink">{aside}</span> : null}
    </nav>
  );
}
