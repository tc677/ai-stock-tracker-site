"use client";

import { useIntro } from "./Intro";

// Three full-width chart-like lines that span the screen left-to-right,
// drawn in once the intro hands off to the visible page. Color and
// vertical direction follow the portfolio trend: rising emerald lines
// when up, falling rose lines when down. After draw-in each line
// settles into a staggered marketPulse every ~10 s.

// 200 x 100 viewBox so the polyline has room for some detail across
// the full width without distorting at high aspect ratios.
const PATH_UP =
  "M 0 88 L 12 84 L 24 86 L 36 78 L 48 80 L 60 70 L 72 74 L 84 64 L 96 68 L 108 56 L 120 60 L 132 48 L 144 52 L 156 38 L 168 42 L 180 28 L 192 22 L 200 18";
const PATH_DOWN =
  "M 0 12 L 12 16 L 24 14 L 36 22 L 48 20 L 60 30 L 72 26 L 84 36 L 96 32 L 108 44 L 120 40 L 132 52 L 144 48 L 156 62 L 168 58 L 180 72 L 192 78 L 200 82";

const DRAW_DURATION = 1800;

function LineSvg({
  up,
  top,
  delay,
}: {
  up: boolean;
  top: string;
  delay: number;
}) {
  const pulseDelay = delay + DRAW_DURATION + 200;

  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      className="absolute left-0 w-screen"
      style={{
        top,
        height: "22vh",
        color: up ? "rgb(74, 222, 128)" : "rgb(248, 113, 113)",
        opacity: 0.07,
        animation: `marketPulse 10s ease-in-out ${pulseDelay}ms infinite`,
      }}
    >
      <path
        d={up ? PATH_UP : PATH_DOWN}
        stroke="currentColor"
        strokeWidth={0.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 420,
          strokeDashoffset: 420,
          animation: `arrowDraw ${DRAW_DURATION}ms ease-out ${delay}ms forwards`,
        }}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function MarketBackdrop({ up }: { up: boolean }) {
  const { phase } = useIntro();
  const revealed = phase === "plop" || phase === "done";

  // Three lines: upper, middle, lower thirds. Stagger draw delays so
  // they sweep in one after another rather than all at once.
  const lines = [
    { top: "12%", delay: 0 },
    { top: "42%", delay: 350 },
    { top: "72%", delay: 700 },
  ];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {revealed &&
        lines.map((l, i) => (
          <LineSvg key={i} up={up} top={l.top} delay={l.delay} />
        ))}
    </div>
  );
}
