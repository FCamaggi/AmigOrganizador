import { initialOf } from "@/lib/format";

/** The enamel line sign at the top of every plan screen. */
export function PlanSign({
  title,
  meta,
  badgeColor = "var(--line-red)",
}: {
  readonly title: string;
  readonly meta: string;
  readonly badgeColor?: string;
}) {
  return (
    <header className="flex items-center gap-2.5 rounded-cloth bg-ink px-3 py-2.5 text-white">
      <span
        aria-hidden="true"
        className="grid size-8 flex-none place-items-center rounded-full font-extrabold text-base"
        style={{ background: badgeColor }}
      >
        {initialOf(title)}
      </span>
      <div className="min-w-0">
        <h1 className="text-balance font-extrabold text-xl leading-tight tracking-[0.01em]">
          {title}
        </h1>
        <p className="mt-px text-ink-sub text-xs">{meta}</p>
      </div>
    </header>
  );
}
