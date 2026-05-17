"use client";

import { useEffect, useRef, useState } from "react";
import { useIntro } from "./Intro";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// Tweens a number from a starting value to `value`, kicking off once the
// intro has handed off to the visible page (phase "plop" or "done"). On
// the first animation, starts from 0; on subsequent value changes, tweens
// from the previous target — useful for the live-update path later.
export function AnimatedNumber({
  value,
  duration = 1300,
  startDelay = 0,
  format,
  className,
}: {
  value: number;
  duration?: number;
  startDelay?: number;
  format: (n: number) => string;
  className?: string;
}) {
  const { phase } = useIntro();
  const shouldAnimate = phase === "plop" || phase === "done";
  const [display, setDisplay] = useState(0);
  const prevTargetRef = useRef(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!shouldAnimate) return;

    const from = hasAnimatedRef.current ? prevTargetRef.current : 0;
    const startAt = performance.now() + startDelay;
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - startAt;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    hasAnimatedRef.current = true;
    prevTargetRef.current = value;

    return () => cancelAnimationFrame(raf);
  }, [shouldAnimate, value, duration, startDelay]);

  return <span className={className}>{format(display)}</span>;
}
