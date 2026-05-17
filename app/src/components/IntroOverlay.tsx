"use client";

import { useEffect, useState } from "react";

const TARGET = "CanMyAITrade";
const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!<>-_\\/[]{}=+*^?#";

// Tunables (ms)
const REVEAL_DELAY_PER_CHAR = 110; // gap between locking each character
const SCRAMBLE_TICK = 40; // how fast unresolved chars cycle
const HOLD_AFTER_REVEAL = 700; // pause once the title is fully shown
const ZOOM_OUT_DURATION = 900; // fade + scale duration

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

export function IntroOverlay() {
  // Start as null so SSR and first client render match (no overlay markup),
  // then decide on mount whether to play. This avoids hydration mismatch.
  const [phase, setPhase] = useState<"idle" | "decrypt" | "zoom" | "done">(
    "idle",
  );
  const [display, setDisplay] = useState(" ".repeat(TARGET.length));

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("introPlayed") === "1") {
      setPhase("done");
      return;
    }
    sessionStorage.setItem("introPlayed", "1");
    setPhase("decrypt");
  }, []);

  useEffect(() => {
    if (phase !== "decrypt") return;

    let lockedCount = 0;
    const totalReveal = TARGET.length * REVEAL_DELAY_PER_CHAR;

    const scrambleInterval = setInterval(() => {
      setDisplay(() => {
        const chars: string[] = [];
        for (let i = 0; i < TARGET.length; i++) {
          if (i < lockedCount) {
            chars.push(TARGET[i]);
          } else if (TARGET[i] === " ") {
            chars.push(" ");
          } else {
            chars.push(randomChar());
          }
        }
        return chars.join("");
      });
    }, SCRAMBLE_TICK);

    const lockTimers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= TARGET.length; i++) {
      lockTimers.push(
        setTimeout(() => {
          lockedCount = i;
        }, i * REVEAL_DELAY_PER_CHAR),
      );
    }

    const finishTimer = setTimeout(() => {
      clearInterval(scrambleInterval);
      setDisplay(TARGET);
      const zoomTimer = setTimeout(() => {
        setPhase("zoom");
        const doneTimer = setTimeout(
          () => setPhase("done"),
          ZOOM_OUT_DURATION,
        );
        // store for cleanup
        lockTimers.push(doneTimer);
      }, HOLD_AFTER_REVEAL);
      lockTimers.push(zoomTimer);
    }, totalReveal + 60);

    return () => {
      clearInterval(scrambleInterval);
      lockTimers.forEach(clearTimeout);
      clearTimeout(finishTimer);
    };
  }, [phase]);

  if (phase === "idle" || phase === "done") return null;

  const zooming = phase === "zoom";

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      style={{
        opacity: zooming ? 0 : 1,
        transition: `opacity ${ZOOM_OUT_DURATION}ms ease-in`,
        pointerEvents: zooming ? "none" : "auto",
      }}
    >
      <div
        className="font-semibold tracking-tight text-white select-none"
        style={{
          fontSize: "clamp(2rem, 7vw, 5rem)",
          transform: zooming ? "scale(0.15)" : "scale(1)",
          transition: `transform ${ZOOM_OUT_DURATION}ms cubic-bezier(0.7, 0, 0.3, 1)`,
          whiteSpace: "pre",
        }}
      >
        {display}
      </div>
    </div>
  );
}
