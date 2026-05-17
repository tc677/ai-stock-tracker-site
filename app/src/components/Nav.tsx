"use client";

import Link from "next/link";
import { useIntro } from "./Intro";

export function Nav() {
  const { phase, display, showEmoji } = useIntro();
  const plopping = phase === "plop";
  const inIntro = phase === "decrypt" || phase === "plop" || phase === "zoom";

  // Render the emoji at 4x its visible font size and counter-scale it
  // by 0.25 so the on-screen size matches the surrounding text. This
  // gives the browser a 4x-resolution raster to upsample from when the
  // page wrapper is at scale(6), so the emoji stays crisp.
  //
  // transform-origin is set near the text baseline (~80% down a 4em
  // box) so the scaled-down glyph collapses toward the baseline of
  // the surrounding text, not toward the geometric middle of the
  // outer box.
  const emojiOuterStyle: React.CSSProperties | undefined = inIntro
    ? {
        display: "inline-block",
        fontSize: "4em",
        lineHeight: 1,
        // Negative margins pull the surrounding flex layout in to the
        // visible glyph size (~1em) instead of the underlying 4em box.
        margin: "0 -1.5em",
        transform: "scale(0.25)",
        transformOrigin: "50% 80%",
      }
    : undefined;

  return (
    <header
      className={
        inIntro
          ? ""
          : "border-b border-zinc-200 dark:border-zinc-800"
      }
    >
      <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-center">
        <Link
          href="/"
          className="font-semibold tracking-tight text-lg flex items-baseline gap-2"
        >
          <span style={{ whiteSpace: "pre" }}>{display}</span>
          {showEmoji && (
            <span style={emojiOuterStyle}>
              <span
                className="inline-block"
                style={{
                  animation: plopping
                    ? "introPlop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both"
                    : undefined,
                }}
              >
                🤔
              </span>
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
