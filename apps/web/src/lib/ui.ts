/** Shared button styles: one primary and one secondary shape everywhere. */
export const buttonClasses = {
  /** The screen's one action: a madder sewn label in the rope face. */
  primary:
    "btn-sewn flex h-[3.125rem] w-full items-center justify-center rounded-cloth px-4 font-rope text-[1.375rem] leading-none no-underline",
  secondary:
    "btn-sewn btn-sewn-ink flex min-h-11 flex-1 items-center justify-center rounded-cloth px-3 text-center font-bold text-[0.9375rem] no-underline",
  /** Done / save inside a sheet. */
  confirm:
    "btn-sewn btn-sewn-ink flex min-h-11 flex-1 items-center justify-center rounded-cloth px-4 font-extrabold text-[0.9375rem]",
} as const;

/**
 * Page shells. Every screen is fluid: full width with a 16px gutter on a
 * phone, wider gutters and columns from `sm`, and multi-column layouts from
 * `lg`. Never cap a screen at phone width on a large display.
 */
export const shellClasses = {
  /** Screens with a desktop layout of their own: groups, group, profile. */
  wide: "mx-auto min-h-dvh w-full px-4 pt-1 sm:max-w-2xl sm:px-6 md:max-w-3xl lg:max-w-6xl lg:px-8 lg:pt-6",
  /** Single-task screens (sign in, create): a readable measure at any width. */
  narrow: "mx-auto min-h-dvh w-full px-4 pt-1 sm:max-w-xl sm:px-6 sm:pt-6",
  /** Sticky action footer that bleeds to the shell gutter (`sm` included). */
  footer:
    "sticky-footer sticky bottom-0 -mx-4 border-rule border-t bg-ground px-4 pt-2.5 pb-[max(1.125rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6",
} as const;
