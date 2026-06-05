import type { Activity, Position } from "@/lib/types";

// AI status line: a single mono-styled string that reads like the
// model narrating its own state. Computed on the server; refreshed
// whenever the page re-renders (ISR every ~10s).
export function AIStatusLine({
  positions,
  activity,
  model = "claude-opus-4-7",
}: {
  positions: Position[];
  activity: Activity[];
  model?: string;
}) {
  const holdingPart =
    positions.length === 0
      ? "all cash"
      : `holding ${positions.length} position${positions.length === 1 ? "" : "s"}`;
  const lastTrade = activity[0]?.filled_at
    ? relTime(activity[0].filled_at)
    : null;
  const tradePart = lastTrade ? `last trade ${lastTrade}` : "no trades yet";

  return (
    <div className="mt-2 font-mono text-[11px] tracking-tight text-zinc-500">
      <span
        className="terminal-cursor"
        style={{ color: "var(--ai-accent)" }}
      >
        ▍
      </span>{" "}
      <span>{holdingPart}</span>
      <span className="px-1.5 text-zinc-400 dark:text-zinc-600">·</span>
      <span>{tradePart}</span>
      <span className="px-1.5 text-zinc-400 dark:text-zinc-600">·</span>
      <span>model: {model}</span>
    </div>
  );
}

function relTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
