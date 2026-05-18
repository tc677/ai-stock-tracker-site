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
// Default scale when we can't compute one yet. Real scale is computed
// per-viewport on mount so the giant title stays a reasonable size on
// both phones and desktops.
const DEFAULT_SCALE = 6;

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [display, setDisplay] = useState(" ".repeat(TARGET.length));
  // Computed on mount: pixel transform-origin (in page space) at the
  // title's natural center, a vertical translate that positions the
  // scaled-up title in the middle of the viewport, and a scale factor
  // sized for the viewport width.
  const [intro, setIntro] = useState<{
    origin: string;
    translateY: number;
    scale: number;
  }>({ origin: "50% 0", translateY: 0, scale: DEFAULT_SCALE });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("introPlayed") === "1") {
      setPhase("done");
      return;
    }

    // Measure the text span itself, not the whole Link. The Link also
    // contains an emoji slot that reserves layout space even when the
    // emoji is hidden; if we measured the Link we'd center the giant
    // title using the combined width, pulling the visible text off
    // viewport center.
    const titleEl = document.querySelector(
      'header a[href="/"] > span:first-child',
    );
    if (titleEl) {
      const rect = titleEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Pick a scale that keeps the giant title comfortably inside the
      // viewport. The title is ~140px wide at the nav's text-lg size; we
      // want it to occupy ~75% of the viewport width during the giant
      // phase. Clamp between 2.8 and 7 so the effect still feels dramatic
      // on every screen size.
      const scale = Math.max(2.8, Math.min(7, (vw * 0.75) / rect.width));

      // Anchor the scale at the title's natural center so it stays put
      // during the size change. Then translate the whole wrapper so the
      // title's center lands at the viewport's vertical midpoint.
      setIntro({
        origin: `${cx}px ${cy}px`,
        translateY: vh / 2 - cy,
        scale,
      });
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
        // Giant phase: translate the wrapper so the title's center
        // lands at viewport center, then scale up. Zoom phase: animate
        // both back to identity, so the title slides up to its real
        // nav position while shrinking.
        transform: zooming
          ? "translateY(0px) scale(1)"
          : `translateY(${intro.translateY}px) scale(${intro.scale})`,
        transformOrigin: intro.origin,
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
