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
const PLOP_DURATION = 600;
const HOLD_AFTER_PLOP = 500;
const ZOOM_DURATION = 1300;
const ZOOM_SCALE = 6;

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
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

    let plopTimer: ReturnType<typeof setTimeout> | null = null;
    const finish = setTimeout(() => {
      clearInterval(tick);
      setDisplay(TARGET);
      plopTimer = setTimeout(() => setPhase("plop"), HOLD_AFTER_DECRYPT);
    }, total + 60);

    return () => {
      clearInterval(tick);
      lockTimers.forEach(clearTimeout);
      clearTimeout(finish);
      if (plopTimer) clearTimeout(plopTimer);
    };
  }, [phase]);

  // plop -> zoom -> done
  useEffect(() => {
    if (phase === "plop") {
      const t = setTimeout(
        () => setPhase("zoom"),
        PLOP_DURATION + HOLD_AFTER_PLOP,
      );
      return () => clearTimeout(t);
    }
    if (phase === "zoom") {
      const t = setTimeout(() => setPhase("done"), ZOOM_DURATION);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const inIntro =
    phase === "decrypt" || phase === "plop" || phase === "zoom";
  const zooming = phase === "zoom";

  // Lock body scroll + paint black backdrop while we're zoomed in.
  // Once we hit "zoom", we transition the body bg back to its natural
  // color in sync with the scale animation so the page becomes visible
  // as part of the same step-back motion (no separate fade).
  useEffect(() => {
    if (!inIntro) {
      document.body.style.overflow = "";
      document.body.style.backgroundColor = "";
      document.body.style.transition = "";
      return;
    }
    document.body.style.overflow = "hidden";
    if (phase === "decrypt" || phase === "plop") {
      document.body.style.transition = "";
      document.body.style.backgroundColor = "#000";
    } else if (phase === "zoom") {
      document.body.style.transition = `background-color ${ZOOM_DURATION}ms ease-out`;
      document.body.style.backgroundColor = "";
    }
  }, [inIntro, phase]);

  const wrapperStyle: CSSProperties = inIntro
    ? {
        transform: zooming ? "scale(1)" : `scale(${ZOOM_SCALE})`,
        transformOrigin: "50% 0",
        transition: zooming
          ? `transform ${ZOOM_DURATION}ms cubic-bezier(0.7, 0, 0.3, 1)`
          : "none",
        willChange: "transform",
      }
    : {};

  const showEmoji =
    phase === "plop" ||
    phase === "zoom" ||
    phase === "done" ||
    phase === "idle";

  const ctxValue: IntroState = {
    phase,
    display: inIntro ? display : "CanMyAITrade",
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
