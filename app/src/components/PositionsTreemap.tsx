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
          stroke="#0a0a0a"
          isAnimationActive={false}
          content={<Tile />}
        >
          <Tooltip content={<TileTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

// Smooth color gradient: rose at -CAP%, zinc at 0%, emerald at +CAP%.
// Values outside ±CAP saturate at the endpoint colors.
const CAP_PCT = 10;
const LOSS = [225, 29, 72];   // rose-600
const FLAT = [82, 82, 91];    // zinc-600
const GAIN = [5, 150, 105];   // emerald-600

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function fillFor(pct: number): string {
  const clamped = Math.max(-CAP_PCT, Math.min(CAP_PCT, pct));
  const t = Math.abs(clamped) / CAP_PCT;
  const target = clamped >= 0 ? GAIN : LOSS;
  const r = lerp(FLAT[0], target[0], t);
  const g = lerp(FLAT[1], target[1], t);
  const b = lerp(FLAT[2], target[2], t);
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

// Pick black or white for the label based on the tile's perceived luminance.
// Uses Rec. 709 weights; threshold ~150 reads well on this palette.
function textColorFor(fill: string): string {
  const m = fill.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return "#fafafa";
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 150 ? "#000000" : "#ffffff";
}

function Tile(props: TileProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", payload } = props;
  const pct = payload?.plPct ?? props.plPct ?? 0;
  const fill = fillFor(pct);
  const textColor = textColorFor(fill);
  const showLabel = width > 36 && height > 24;
  const showPct = width > 60 && height > 44;
  const symbolSize = Math.min(28, Math.max(13, Math.min(width, height) / 3.5));
  const pctSize = Math.min(16, Math.max(11, symbolSize * 0.6));

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill, stroke: "#0a0a0a", strokeWidth: 1 }}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showPct ? symbolSize * 0.4 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={symbolSize}
          fontWeight={800}
        >
          {name}
        </text>
      )}
      {showPct && (
        <text
          x={x + width / 2}
          y={y + height / 2 + symbolSize * 0.55}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={pctSize}
          fontWeight={700}
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
