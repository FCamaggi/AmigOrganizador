/**
 * Waiting, in thread language: a short spun strand passes over and under
 * the warp while a button waits. Drawn in the button's own colour; still
 * (one strand at rest) when the person prefers reduced motion.
 */
export function Shuttle() {
  return (
    <span
      aria-hidden="true"
      className="relative mr-2.5 inline-flex h-4 w-12 flex-none items-center overflow-hidden"
    >
      {[12, 37, 62, 87].map((left, index) => (
        <span
          key={left}
          className={`absolute top-0.5 h-3 w-[1.5px] rounded-full bg-current ${
            index % 2 ? "z-10" : "opacity-45"
          }`}
          style={{ left: `${left}%` }}
        />
      ))}
      <span
        className="shuttle-run yarn yarn-tint absolute left-0 h-1.5 w-5 rounded-full"
        style={{ backgroundColor: "currentColor" }}
      />
    </span>
  );
}
