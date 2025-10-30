"use client";

import { memo } from "react";
import type { CSSProperties } from "react";

export interface BarDatum {
  label: string;
  value: number;
  hint?: string;
}

interface BarChartProps {
  data: BarDatum[];
  maxBars?: number;
  valueLabel?: string;
  decimals?: number;
}

const Chart = ({ data, maxBars = 8, valueLabel = "h", decimals = 1 }: BarChartProps) => {
  if (!data.length) {
    return <p style={styles.empty}>No data yet.</p>;
  }

  const trimmed = data.slice(0, maxBars);
  const maxValue = Math.max(...trimmed.map((item) => item.value), 0);

  return (
    <div style={styles.wrapper}>
      {trimmed.map((item) => {
        const fraction = maxValue > 0 ? item.value / maxValue : 0;
        const formattedValue = item.value.toFixed(decimals);
        return (
          <div key={item.label} style={styles.row}>
            <div style={styles.labelCell}>
              <span style={styles.labelText} title={item.hint ?? item.label}>
                {item.label}
              </span>
            </div>
            <div style={styles.barCell}>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${Math.max(fraction * 100, 2)}%`
                  }}
                />
              </div>
            </div>
            <div style={styles.valueCell}>
              {formattedValue}
              {valueLabel}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: "0.75rem",
    width: "100%"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 4fr) auto",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.35rem 0.5rem",
    borderRadius: "0.65rem",
    background: "rgba(15, 23, 42, 0.4)",
    border: "1px solid rgba(148, 163, 184, 0.08)"
  },
  labelCell: {
    minWidth: 0
  },
  labelText: {
    display: "inline-block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
    fontWeight: 500,
    lineHeight: 1.4
  },
  barCell: {
    width: "100%"
  },
  barTrack: {
    width: "100%",
    height: "0.75rem",
    borderRadius: "0.5rem",
    background: "rgba(148, 163, 184, 0.25)",
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: "0.5rem",
    background: "linear-gradient(90deg, #38bdf8, #fb7185)"
  },
  valueCell: {
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    justifySelf: "flex-end",
    minWidth: "3.5rem",
    textAlign: "right"
  },
  empty: {
    fontStyle: "italic",
    color: "rgba(148, 163, 184, 0.9)"
  }
};

export const BarChart = memo(Chart);
