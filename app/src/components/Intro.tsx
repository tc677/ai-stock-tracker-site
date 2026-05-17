"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
} from "react";

type Phase = "idle" | "decrypt" | "plop" | "zoom" | "done";

type IntroState = {
  phase: Phase;
  display: string;
  showEmoji: boolean;
};

const DEFAULT_STATE: IntroState = {
  phase: "done",
  display: "CanMyAITrade",
  showEmoji: true,
};

const IntroCtx = createContext<IntroState>(DEFAULT_STATE);
export const useIntro = () => useContext(IntroCtx);

const TARGET = "CanMyAITrade";
const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!<>-_\\/[]{}=+*^?#";

// Tunables (ms)
const SCRAMBLE_TICK = 40;
const REVEAL_DELAY_PER_CHAR = 110;
const HOLD_AFTER_DECRYPT = 700;
const ZOOM_DURATION = 1300;
const HOLD_AFTER_ZOOM = 250;
const PLOP_DURATION = 600;
const ZOOM_SCALE = 6;

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [display, setDisplay] = useState(" ".repeat(TARGET.length));
  // Pixel coords (in page space) of the nav title's center, used as the
  // scale's transform-origin so the giant title stays anchored to where
  // the small title actually lives.
  const [origin, setOrigin] = useState<string>("50% 0");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("introPlayed") === "1") {
      setPhase("done");
      return;
    }

    const titleEl = document.querySelector('header a[href="/"]');
    if (titleEl) {
      const rect = titleEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      // Anchor at the title's top edge, not its center, so the
      // scaled-up title extends *downward* from its natural y and
      // never gets clipped at the top of the viewport.
      const cy = rect.top;
      setOrigin(`${cx}px ${cy}px`);
    }

    sessionStorage.setItem("introPlayed", "1");
    setPhase("decrypt");
  }, []);

  // Decrypt animation
  useEffect(() => {
    if (phase !== "decrypt") return;
    let lockedCount = 0;
    const total = TARGET.length * REVEAL_DELAY_PER_CHAR;

    const tick = setInterval(() => {
      setDisplay(() => {
        const chars: string[] = [];
        for (let i = 0; i < TARGET.length; i++) {
          if (i < lockedCount) chars.push(TARGET[i]);
          else if (TARGET[i] === " ") chars.push(" ");
          else chars.push(randomChar());
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

    let zoomTimer: ReturnType<typeof setTimeout> | null = null;
    const finish = setTimeout(() => {
      clearInterval(tick);
      setDisplay(TARGET);
      zoomTimer = setTimeout(() => setPhase("zoom"), HOLD_AFTER_DECRYPT);
    }, total + 60);

    return () => {
      clearInterval(tick);
      lockTimers.forEach(clearTimeout);
      clearTimeout(finish);
      if (zoomTimer) clearTimeout(zoomTimer);
    };
  }, [phase]);

  // zoom -> plop -> done
  useEffect(() => {
    if (phase === "zoom") {
      const t = setTimeout(
        () => setPhase("plop"),
        ZOOM_DURATION + HOLD_AFTER_ZOOM,
      );
      return () => clearTimeout(t);
    }
    if (phase === "plop") {
      const t = setTimeout(() => setPhase("done"), PLOP_DURATION);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const inWrapperScale = phase === "decrypt" || phase === "zoom";
  const zooming = phase === "zoom";

  // Lock body scroll + paint black backdrop while we're zoomed in.
  // Once we hit "zoom", we transition the body bg back to its natural
  // color in sync with the scale animation so the page becomes visible
  // as part of the same step-back motion (no separate fade).
  useEffect(() => {
    if (!inWrapperScale) {
      document.body.style.overflow = "";
      document.body.style.backgroundColor = "";
      document.body.style.transition = "";
      document.body.removeAttribute("data-intro");
      return;
    }
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-intro", phase);
    if (phase === "decrypt") {
      document.body.style.transition = "";
      document.body.style.backgroundColor = "#000";
    } else if (phase === "zoom") {
      document.body.style.transition = `background-color ${ZOOM_DURATION}ms ease-out`;
      document.body.style.backgroundColor = "";
    }
  }, [inWrapperScale, phase]);

  const wrapperStyle: CSSProperties = inWrapperScale
    ? {
        transform: zooming ? "scale(1)" : `scale(${ZOOM_SCALE})`,
        transformOrigin: origin,
        transition: zooming
          ? `transform ${ZOOM_DURATION}ms cubic-bezier(0.7, 0, 0.3, 1)`
          : "none",
        willChange: "transform",
      }
    : {};

  // Emoji hides during the giant-scaled decrypt and during the zoom
  // shrink. It first appears in the "plop" phase, bouncing into the
  // already-normal-sized nav title.
  const showEmoji =
    phase === "plop" || phase === "done" || phase === "idle";

  const ctxValue: IntroState = {
    phase,
    display: phase === "decrypt" ? display : "CanMyAITrade",
    showEmoji,
  };

  return (
    <IntroCtx.Provider value={ctxValue}>
      <div className="flex flex-1 flex-col" style={wrapperStyle}>
        {children}
      </div>
    </IntroCtx.Provider>
  );
}
