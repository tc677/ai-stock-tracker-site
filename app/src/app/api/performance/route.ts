import { NextResponse } from "next/server";
import { getPerformanceSeries } from "@/lib/queries";
import { RANGES, type Range } from "@/lib/ranges";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rangeParam = new URL(req.url).searchParams.get("range") ?? "YTD";
  const range = (RANGES as string[]).includes(rangeParam)
    ? (rangeParam as Range)
    : ("YTD" as Range);

  const series = await getPerformanceSeries(range);
  return NextResponse.json({ range, series });
}
