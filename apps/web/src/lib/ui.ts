/** Shared button styles: one primary and one secondary shape everywhere. */
export const buttonClasses = {
  primary:
    "flex h-[3.125rem] w-full items-center justify-center rounded-sign bg-line-blue px-4 font-extrabold text-[1.0625rem] text-white no-underline active:bg-[#00539c] disabled:bg-rule-strong disabled:text-ink",
  secondary:
    "flex min-h-11 flex-1 items-center justify-center rounded-sign border-[1.5px] border-ink bg-white px-3 text-center font-bold text-[0.9375rem] text-ink no-underline active:bg-panel",
} as const;
