"use client";

import { memo, useMemo } from "react";
import type { CSSProperties } from "react";

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
  hint?: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  innerRadius?: number;
  legend?: boolean;
}

interface DonutSlice {
  label: string;
  value: number;
  color: string;
  start: number;
  end: number;
  fraction: number;
}

const DonutChartComponent = ({
  data,
  size = 220,
  innerRadius = 60,
  legend = true
}: DonutChartProps) => {
  const prepared = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) {
      return null;
    }

    const filtered = data.filter((item) => item.value > 0);
    if (!filtered.length) {
      return null;
    }

    let cumulative = 0;
    const slices: DonutSlice[] = filtered.map((item, index) => {
      const fraction = item.value / total;
      const start = cumulative;
      cumulative += fraction;
      const end = index === filtered.length - 1 ? 1 : cumulative;
      return {
        label: item.label,
        value: item.value,
        color: item.color ?? defaultPalette[index % defaultPalette.length],
        start,
        end,
        fraction
      };
    });

    const gradientStops = slices
      .map((slice) => `${slice.color} ${slice.start * 360}deg ${slice.end * 360}deg`)
      .join(", ");

    const background = gradientStops
      ? `conic-gradient(${gradientStops})`
      : "rgba(148, 163, 184, 0.2)";

    return { total, slices, background };
  }, [data]);

  if (!prepared) {
    return <p style={styles.empty}>No data to display yet.</p>;
  }

  const safeInnerRadius = Math.max(20, Math.min(innerRadius, size / 2 - 8));

  return (
    <div style={{ ...styles.wrapper, width: size }}>
      <div
        style={{
          ...styles.pie,
          width: size,
          height: size,
          background: prepared.background
        }}
      >
        <div
          style={{
            ...styles.hole,
            width: safeInnerRadius * 2,
            height: safeInnerRadius * 2
          }}
        />
        <span style={styles.totalLabel}>{prepared.total.toFixed(1)}h</span>
      </div>
      {legend ? (
        <div style={styles.legend}>
          {prepared.slices.map((slice) => (
            <span
              key={slice.label}
              style={styles.legendItem}
              title={`${slice.label}: ${slice.value.toFixed(1)}h (${Math.round(
                slice.fraction * 100
              )}%)`}
            >
              <span
                style={{
                  ...styles.legendSwatch,
                  backgroundColor: slice.color
                }}
              />
              <span style={styles.legendLabel}>{slice.label}</span>
              <span style={styles.legendValue}>{slice.value.toFixed(1)}h</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const defaultPalette = [
  "#38bdf8",
  "#fb7185",
  "#facc15",
  "#4ade80",
  "#a855f7",
  "#f97316"
] as const;

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    justifyItems: "center",
    gap: "1rem"
  },
  pie: {
    position: "relative",
    borderRadius: "50%",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    filter: "drop-shadow(0 10px 25px rgba(15, 23, 42, 0.45))"
  },
  hole: {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(15, 23, 42, 0.9)",
    boxShadow: "inset 0 0 0 1px rgba(148, 163, 184, 0.15)"
  },
  totalLabel: {
    position: "relative",
    zIndex: 1,
    color: "#f8fafc",
    fontSize: "1.25rem",
    fontWeight: 600
  },
  legend: {
    display: "grid",
    gap: "0.5rem",
    width: "100%"
  },
  legendItem: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: "0.6rem",
    fontSize: "0.9rem",
    color: "rgba(226, 232, 240, 0.9)"
  },
  legendSwatch: {
    width: "0.75rem",
    height: "0.75rem",
    borderRadius: "50%"
  },
  legendLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%"
  },
  legendValue: {
    color: "rgba(148, 163, 184, 0.85)",
    fontVariantNumeric: "tabular-nums"
  },
  empty: {
    fontStyle: "italic",
    color: "rgba(148, 163, 184, 0.9)"
  }
};

export const DonutChart = memo(DonutChartComponent);
