/** Group or plan title and headcount on the grey-wool ground. */
export function PlanSign({
  title,
  meta,
}: {
  readonly title: string;
  readonly meta: string;
}) {
  return (
    <header className="mt-2">
      <h1 className="text-balance font-extrabold text-[2rem] leading-[1.05] tracking-[-0.02em] sm:text-[2.25rem]">
        {title}
      </h1>
      <p className="mt-1 text-[0.9375rem] text-mute">{meta}</p>
    </header>
  );
}
