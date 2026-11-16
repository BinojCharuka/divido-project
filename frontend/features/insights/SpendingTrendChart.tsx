import { ChartNoAxesCombined } from "lucide-react";
import { amountDigits } from "@/lib/formatting/decimal";
import { formatMonthYear } from "@/lib/formatting/dates";
import type { Insights } from "@/types/insights";
import { formatRange } from "./observationCopy";

const WIDTH = 600;
const BASE = 190;
const HEIGHT = 180;
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function shortMonth(month: string): string {
  return formatMonthYear(month).slice(0, 3);
}

/**
 * Six calendar months of recorded spending (DEC-041). Months before the first
 * transaction have no point at all rather than a zero; the month in progress is
 * marked as partial. Geometry uses numbers; every printed amount is the API string.
 */
export function SpendingTrendChart({ insights }: { insights: Insights }) {
  const { trend, comparison } = insights;
  const values = trend.map((m) => (m.totalSpent === null ? null : Number(m.totalSpent)));
  const max = Math.max(0, ...values.filter((v): v is number => v !== null));
  const top = max > 0 ? max : 1;
  const step = WIDTH / (trend.length - 1);
  const points = trend
    .map((m, i) => (values[i] === null ? null : { x: i * step, y: BASE - ((values[i] as number) / top) * HEIGHT, partial: m.partial }))
    .filter((p): p is { x: number; y: number; partial: boolean } => p !== null);

  const description = trend
    .map((m) => `${formatMonthYear(m.month)}${m.partial ? " so far" : ""}: ${m.totalSpent === null ? "no activity" : `LKR ${amountDigits(m.totalSpent)}`}`)
    .join("; ");
  const previousLabel = insights.partialMonth ? "the same days last month" : formatMonthYear(comparison.previousStart);

  return (
    <section className="panel chart-panel" aria-labelledby="trend-heading">
      <div className="section-heading">
        <h2 id="trend-heading">Spending over time</h2>
        <span className="subtle-tag">LKR</span>
      </div>
      <div className="chart-legend">
        <span>
          <i /> Recorded spending
        </span>
        {insights.partialMonth && (
          <span>
            <i className="dashed" /> Month in progress
          </span>
        )}
      </div>
      <div className="line-chart">
        <div className="chart-y-axis" aria-hidden="true">
          {[1, 0.75, 0.5, 0.25, 0].map((f) => (
            <span key={f}>{max > 0 ? compact.format(max * f) : f === 0 ? "0" : ""}</span>
          ))}
        </div>
        {/* Stretched to the box so values line up with the axis labels; strokes and dots keep their size. */}
        <svg
          viewBox={`0 0 ${WIDTH} 210`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Recorded spending by month. ${description}.`}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M0 ${BASE - (HEIGHT / 4) * i}H${WIDTH}`}
              stroke="currentColor"
              strokeOpacity=".08"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {points.length > 1 && (
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              className="spend-line"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {points.map((p) => (
            <g key={p.x} className={`trend-dot ${p.partial ? "partial" : ""}`}>
              <path d={`M${p.x} ${p.y}h0`} className="trend-dot-ring" vectorEffect="non-scaling-stroke" />
              <path d={`M${p.x} ${p.y}h0`} className="trend-dot-core" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
      </div>
      <div className="chart-x-axis" aria-hidden="true">
        {trend.map((m) => (
          <span key={m.month}>
            {shortMonth(m.month)}
            {m.partial ? "*" : ""}
          </span>
        ))}
      </div>
      <div className="chart-summary">
        <ChartNoAxesCombined size={17} aria-hidden="true" />
        <p>
          {formatRange(comparison.currentStart, comparison.currentEnd)}: LKR {amountDigits(comparison.currentSpent)} recorded, compared
          with LKR {amountDigits(comparison.previousSpent)} in {previousLabel}.
          {insights.partialMonth && " * Month in progress."}
          {trend.some((m) => !m.hasActivity) && " Months before your first record show no activity."}
        </p>
      </div>
    </section>
  );
}
