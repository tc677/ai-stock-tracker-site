"use client";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import type { Position } from "@/lib/types";
import { fmtPct, fmtUSD } from "@/lib/format";

type TileDatum = {
  name: string;
  size: number;
  pl: number;
  plPct: number;
  qty: number;
  current: number;
  marketValue: number;
};

export function PositionsTreemap({ positions }: { positions: Position[] }) {
  const data: TileDatum[] = positions.map((p) => ({
    name: p.symbol,
    size: Math.max(Math.abs(Number(p.market_value)), 1),
    pl: Number(p.unrealized_pl),
    plPct: Number(p.unrealized_pl_pct),
    qty: Number(p.qty),
    current: Number(p.current_price),
    marketValue: Number(p.market_value),
  }));

  return (
    <div className="h-[28rem] sm:h-[34rem]">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          nameKey="name"
          stroke="none"
          isAnimationActive={false}
          content={<Tile />}
        >
          <Tooltip content={<TileTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

// 5-stop finviz-style palette: strong red → soft pink → gray → light
// chartreuse → forest green. Piecewise lerp through the stops so big
// movers go dark and near-zero positions stay muted.
const CAP_PCT = 10;
const STOPS: { t: number; rgb: [number, number, number] }[] = [
  { t: -1.0, rgb: [196, 50, 50] },    // strong red at -CAP
  { t: -0.5, rgb: [243, 165, 165] },  // soft pink mid-loss
  { t: 0.0, rgb: [140, 140, 140] },   // neutral gray
  { t: 0.5, rgb: [170, 207, 105] },   // chartreuse mid-gain
  { t: 1.0, rgb: [80, 138, 35] },     // forest green at +CAP
];

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function fillFor(pct: number): string {
  const clamped = Math.max(-CAP_PCT, Math.min(CAP_PCT, pct));
  const t = clamped / CAP_PCT;
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t >= STOPS[i].t && t <= STOPS[i + 1].t) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const span = hi.t - lo.t;
  const local = span === 0 ? 0 : (t - lo.t) / span;
  const r = lerp(lo.rgb[0], hi.rgb[0], local);
  const g = lerp(lo.rgb[1], hi.rgb[1], local);
  const b = lerp(lo.rgb[2], hi.rgb[2], local);
  return `rgb(${r}, ${g}, ${b})`;
}

type TileProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  payload?: TileDatum;
  plPct?: number;
};

// Black or white based on tile luminance (Rec. 709 weights).
function textColorFor(fill: string): string {
  const m = fill.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return "#ffffff";
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 135 ? "#000000" : "#ffffff";
}

function Tile(props: TileProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", payload } = props;
  const pct = payload?.plPct ?? props.plPct ?? 0;
  const fill = fillFor(pct);
  const textColor = textColorFor(fill);
  const showLabel = width > 36 && height > 24;
  const showPct = width > 60 && height > 44;
  const symbolSize = Math.min(40, Math.max(16, Math.min(width, height) / 2.8));
  const pctSize = Math.min(22, Math.max(13, symbolSize * 0.6));

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill, stroke: "none" }}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showPct ? symbolSize * 0.45 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={symbolSize}
          fontWeight={400}
        >
          {name}
        </text>
      )}
      {showPct && (
        <text
          x={x + width / 2}
          y={y + height / 2 + symbolSize * 0.6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={pctSize}
          fontWeight={400}
        >
          {pct >= 0 ? "+" : ""}
          {fmtPct(pct)}
        </text>
      )}
    </g>
  );
}

function TileTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TileDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const positive = d.plPct >= 0;
  const pctColor = positive ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 shadow-lg">
      <div className="font-semibold">{d.name}</div>
      <div className="mt-0.5 tabular-nums text-zinc-200">
        {fmtUSD(Math.abs(d.marketValue))}
      </div>
      <div className={`tabular-nums ${pctColor}`}>
        {positive ? "+" : ""}
        {fmtPct(d.plPct)}
      </div>
    </div>
  );
}
