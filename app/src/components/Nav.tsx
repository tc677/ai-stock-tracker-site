"use client";

import Link from "next/link";
import { useIntro } from "./Intro";

export function Nav() {
  const { phase, display, showEmoji } = useIntro();
  const plopping = phase === "plop";
  const inGiantScale = phase === "decrypt" || phase === "zoom";

  return (
    <header
      className={`border-b ${
        inGiantScale
          ? "border-transparent"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
        <Link
          href="/"
          className="font-semibold tracking-tight text-lg flex items-baseline gap-2"
        >
          <span style={{ whiteSpace: "pre" }}>{display}</span>
          {showEmoji && (
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
          )}
        </Link>
      </nav>
    </header>
  );
}
