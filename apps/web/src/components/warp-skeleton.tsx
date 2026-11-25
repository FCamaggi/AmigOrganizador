import { t } from "@/i18n/t";

/**
 * Loading, in thread language: until the schedules arrive every person is a
 * loose dotted thread (missing information), breathing softly. The real
 * cloth then weaves in over it (`.weave-in`). Still when motion is reduced.
 */
export function WarpSkeleton({
  rows = 4,
  className = "",
}: {
  readonly rows?: number;
  readonly className?: string;
}) {
  return (
    <div className={`rounded-cloth bg-surface px-3 py-2.5 ${className}`}>
      <ul aria-hidden="true" className="space-y-1.5">
        {Array.from({ length: rows }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed placeholder rows
          <li key={index} className="flex h-10 items-center">
            <span className="w-8 flex-none pr-2 lg:w-28">
              <span className="block h-3 w-5 rounded-knot bg-rule lg:w-16" />
            </span>
            <span className="relative h-full flex-1">
              <span
                className="loose-breathe thread-loose absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2"
                style={{ animationDelay: `${index * 160}ms` }}
              />
            </span>
          </li>
        ))}
      </ul>
      <output className="mt-1 block pl-8 text-mute text-sm lg:pl-28">
        {t("loading.weaving")}
      </output>
    </div>
  );
}
