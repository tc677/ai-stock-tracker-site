"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Injects its children into the footer's timestamp slot via a portal,
// so a server page can render data-dependent text (like "Updated …")
// inside the otherwise-shared site footer.
export function FooterTimestamp({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("footer-timestamp-slot"));
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}
