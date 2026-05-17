"use client";

import { useIntro } from "./Intro";

// One jagged stock-chart-style line that stretches across the page
// behind the dashboard. Color and direction follow the portfolio
// trend (emerald rising on up days, rose falling on down days).
//
// Every ~5 s a soft-glow pulse rides along the line from left to right
// by animating stroke-dashoffset on a second copy of the path. The
// highlight follows the line's actual trajectory (up the peaks, down
// through the valleys) instead of sweeping a vertical window across
// the screen, which reads more like a live trading signal.

// 13 segments — varying peak heights so it doesn't look like a uniform
// zigzag. Up version trends bottom-left -> top-right.
const PATH_UP =
  "M 0 90 L 8 82 L 16 86 L 25 72 L 33 78 L 42 60 L 50 68 L 58 50 L 67 56 L 75 38 L 83 44 L 92 24 L 100 18";
const PATH_DOWN =
  "M 0 10 L 8 18 L 16 14 L 25 28 L 33 22 L 42 40 L 50 32 L 58 50 L 67 44 L 75 62 L 83 56 L 92 76 L 100 82";

export function BackgroundTrendLine({ isUp }: { isUp: boolean }) {
  const { phase } = useIntro();
  // The line draws itself and the pulse starts only once the page has
  // handed off from the intro — same trigger as the number tween and
  // color fade, so they all animate in together.
  const revealed = phase === "plop" || phase === "done";

  const color = isUp ? "#10b981" : "#ef4444";
  const path = isUp ? PATH_UP : PATH_DOWN;

  return (
    <svg
      aria-hidden
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: -10,
        color,
      }}
    >
      <defs>
        <filter
          id="bg-trend-glow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {revealed && (
        <>
          {/* Dim base layer. pathLength={100} normalizes the path so
              the draw-in math (stroke-dashoffset 100 -> 0) works
              regardless of how the SVG is stretched to the viewport. */}
          <path
            className="bg-trend-dim"
            d={path}
            pathLength={100}
            stroke="currentColor"
            strokeWidth={0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.12}
            vectorEffect="non-scaling-stroke"
          />

          {/* Glowing pulse: a short visible segment travels along the
              path, looping end-to-end every 10 s. Delayed until after
              the dim line finishes drawing. */}
          <path
            className="bg-trend-pulse"
            d={path}
            pathLength={100}
            stroke="currentColor"
            strokeWidth={0.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#bg-trend-glow)"
            opacity={0.95}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  );
}
