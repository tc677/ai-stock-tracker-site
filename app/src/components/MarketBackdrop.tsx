"use client";

import { useIntro } from "./Intro";

// A subtle decorative layer of stock-chart arrows tiled across the
// viewport. Once the intro hands off to the visible page, each arrow's
// line draws itself across its tile (like the equity chart's line
// animation) and its arrowhead pops in at the end. After that, the
// whole layer pulses every ~10 s.

const PATH_UP =
  "M 5 92 L 16 80 L 24 84 L 36 66 L 48 73 L 60 52 L 72 60 L 84 35 L 95 18";
const ARROWHEAD_UP = "95,18 84,21 88,12";

const PATH_DOWN =
  "M 5 8 L 16 20 L 24 16 L 36 34 L 48 27 L 60 48 L 72 40 L 84 65 L 95 82";
const ARROWHEAD_DOWN = "95,82 84,79 88,88";

const DRAW_DURATION = 1400;

function ArrowSvg({
  up,
  style,
  delay,
}: {
  up: boolean;
  style?: React.CSSProperties;
  delay: number;
}) {
  // Per-element timing: line draws first, arrowhead pops in as the line
  // nears completion, pulse takes over once both are settled.
  const arrowheadDelay = delay + Math.round(DRAW_DURATION * 0.7);
  const pulseDelay = delay + DRAW_DURATION + 200;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute"
      style={{
        ...style,
        color: up ? "rgb(74, 222, 128)" : "rgb(248, 113, 113)",
        opacity: 0.07,
        animation: `marketPulse 10s ease-in-out ${pulseDelay}ms infinite`,
      }}
    >
      <path
        d={up ? PATH_UP : PATH_DOWN}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 320,
          strokeDashoffset: 320,
          animation: `arrowDraw ${DRAW_DURATION}ms ease-out ${delay}ms forwards`,
        }}
      />
      <polygon
        points={up ? ARROWHEAD_UP : ARROWHEAD_DOWN}
        fill="currentColor"
        style={{
          opacity: 0,
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: `arrowheadAppear 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${arrowheadDelay}ms forwards`,
        }}
      />
    </svg>
  );
}

export function MarketBackdrop({ up }: { up: boolean }) {
  const { phase } = useIntro();
  const revealed = phase === "plop" || phase === "done";

  // 5 columns × 4 rows, every other row offset so they don't line up
  // too rigidly. Per-tile draw delay rolls diagonally across the page.
  const tiles: { left: number; top: number; delay: number }[] = [];
  const cols = 5;
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offset = r % 2 === 1 ? 10 : 0;
      tiles.push({
        left: (c * 100) / cols + offset,
        top: (r * 100) / rows,
        delay: (r + c) * 110,
      });
    }
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {revealed &&
        tiles.map((t, i) => (
          <ArrowSvg
            key={i}
            up={up}
            delay={t.delay}
            style={{
              left: `${t.left}%`,
              top: `${t.top}%`,
              width: "20%",
              height: "20%",
            }}
          />
        ))}
    </div>
  );
}
