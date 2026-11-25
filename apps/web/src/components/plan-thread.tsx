"use client";

import { useEffect, useId, useRef, useState } from "react";

const SLACK = 7;
const easeOut = (x: number) => 1 - (1 - x) ** 3;

/**
 * A plan's mark: a spun thread tied between two knots. A proposed plan hangs
 * slack; when it is confirmed the thread pulls taut (220-460ms, only when
 * motion is allowed). The yarn texture is the ink strip from public/yarn/.
 */
export function PlanThread({
  status,
}: {
  readonly status: "proposed" | "confirmed" | "cancelled";
}) {
  const target = status === "confirmed" ? 0 : SLACK;
  const [sag, setSag] = useState(target);
  const current = useRef(target);
  const pattern = `yarn-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const from = current.current;
    if (from === target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setSag(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 460);
      current.current = from + (target - from) * easeOut(p);
      setSag(current.current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const mid = 7 + sag * 2;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 24"
      className="mt-0.5 h-6 w-12 flex-none overflow-visible"
    >
      <defs>
        <pattern
          id={pattern}
          patternUnits="userSpaceOnUse"
          width="24"
          height="6"
          y="4"
        >
          <image
            href="/yarn/ink.webp"
            width="24"
            height="6"
            preserveAspectRatio="none"
          />
        </pattern>
      </defs>
      <path
        d={`M5 7Q24 ${mid} 43 7`}
        fill="none"
        stroke={`url(#${pattern})`}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeDasharray={status === "proposed" ? "7 3" : undefined}
      />
      <circle cx={5} cy={7} r={3.5} fill="var(--color-ink)" />
      <circle cx={43} cy={7} r={3.5} fill="var(--color-ink)" />
    </svg>
  );
}
