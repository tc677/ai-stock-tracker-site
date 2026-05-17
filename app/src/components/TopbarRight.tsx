"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Renders its children into the Nav's right-hand slot via a portal,
// so a server page can inject page-specific data (like the "Updated"
// timestamp) into the otherwise-shared top bar.
export function TopbarRight({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("topbar-right-slot"));
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}
