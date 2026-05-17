"use client";

import { useEffect, useState } from "react";
import { useIntro } from "./Intro";

// One jagged stock-chart-style line that stretches across the page
// behind the dashboard. Color and direction follow the portfolio
// trend (emerald rising on up days, rose falling on down days).
//
// The stroke is painted with a horizontal linearGradient that's mostly
// dim with a bright peak in the middle, and an animateTransform slides
// the gradient end-to-end so the bright window travels along the line.
//
// Draw-in uses a clipPath that scales a rect from 0 -> full width
// (rather than stroke-dasharray, which combined with non-scaling-stroke
// and pathLength left a sub-pixel gap at the end and didn't always
// replay cleanly when the path was conditionally mounted).

const PATH_UP =
  "M 0 90 L 8 82 L 16 86 L 25 72 L 33 78 L 42 60 L 50 68 L 58 50 L 67 56 L 75 38 L 83 44 L 92 24 L 100 18";
const PATH_DOWN =
  "M 0 10 L 8 18 L 16 14 L 25 28 L 33 22 L 42 40 L 50 32 L 58 50 L 67 44 L 75 62 L 83 56 L 92 76 L 100 82";

export function BackgroundTrendLine({ isUp }: { isUp: boolean }) {
  const { phase } = useIntro();
  // Match the rest of the page: mount only once the intro has handed
  // off, so the draw-in and the gradient sweep both start fresh while
  // the user is actually looking.
  const revealed = phase === "plop" || phase === "done";

  // Honor prefers-reduced-motion: the dim line still shows, but the
  // bright window stops sweeping along it.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const color = isUp ? "#10b981" : "#ef4444";
  const path = isUp ? PATH_UP : PATH_DOWN;
  const gradientId = isUp ? "bg-trend-grad-up" : "bg-trend-grad-down";
  const clipId = isUp ? "bg-trend-clip-up" : "bg-trend-clip-down";

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
      }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="100"
          y2="0"
        >
          {/* Five stops: dim on either side of a narrow bright peak.
              The peak ramps smoothly so the highlight reads as a soft
              glow rather than a hard edge. */}
          <stop offset="0" stopColor={color} stopOpacity="0.3" />
          <stop offset="0.44" stopColor={color} stopOpacity="0.3" />
          <stop offset="0.5" stopColor={color} stopOpacity="1" />
          <stop offset="0.56" stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="0.3" />
          {revealed && !reducedMotion && (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-110 0"
              to="110 0"
              dur="10s"
              begin="1.5s"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>
        {/* Draw-in mask: a rect that scales from 0 -> full width
            across the viewBox once the intro has handed off. The
            path itself is always fully drawn, so there are no
            dasharray gaps at the right edge. */}
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          {revealed && (
            <rect
              className="bg-trend-reveal"
              x="0"
              y="0"
              width="100"
              height="100"
            />
          )}
        </clipPath>
      </defs>

      {revealed && (
        <path
          d={path}
          stroke={`url(#${gradientId})`}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          clipPath={`url(#${clipId})`}
        />
      )}
    </svg>
  );
}
