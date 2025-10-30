"use client";

import { memo, useMemo } from "react";
import type { CSSProperties } from "react";

export interface WeeklyStackSegment {
  label: string;
  username?: string;
  value: number;
  color: string;
}

export interface WeeklyStackDatum {
  label: string;
  weekStart: string;
  total: number;
  segments: WeeklyStackSegment[];
}

interface WeeklyStackedBarChartProps {
  data: WeeklyStackDatum[];
  decimals?: number;
}

const WeeklyStackedBarChartComponent = ({
  data,
  decimals = 1
}: WeeklyStackedBarChartProps) => {
  const legendEntries = useMemo(() => {
    const unique = new Map<string, { label: string; color: string }>();
    for (const week of data) {
      for (const segment of week.segments) {
        const key = segment.username ?? segment.label;
        if (!unique.has(key)) {
          unique.set(key, {
            label: segment.label,
            color: segment.color
          });
        }
      }
    }
    return Array.from(unique.values());
  }, [data]);

  if (!data.length) {
    return <p style={styles.empty}>Collect some timelogs to view weekly load.</p>;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.rows}>
        {data.map((week) => (
          <div key={week.weekStart} style={styles.row}>
            <div style={styles.weekLabel}>{week.label}</div>
            <div style={styles.barTrack}>
              {week.segments.map((segment) => {
                const percent =
                  week.total > 0 ? (segment.value / week.total) * 100 : 0;
                return (
                  <div
                    key={`${week.weekStart}-${segment.label}`}
                    style={{
                      ...styles.barSegment,
                      flexGrow: Math.max(segment.value, 0.15),
                      backgroundColor: segment.color
                    }}
                    title={`${segment.label}: ${segment.value.toFixed(decimals)}h`}
                  >
                    {percent > 12 ? (
                      <span style={styles.segmentValue}>
                        {segment.value.toFixed(decimals)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div style={styles.total}>{week.total.toFixed(decimals)}h</div>
          </div>
        ))}
      </div>
      {legendEntries.length ? (
        <div style={styles.legend}>
          {legendEntries.map((entry) => (
            <span key={entry.label} style={styles.legendItem}>
              <span
                style={{
                  ...styles.legendSwatch,
                  backgroundColor: entry.color
                }}
              />
              <span>{entry.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: "1.25rem"
  },
  rows: {
    display: "grid",
    gap: "0.85rem"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(120px, 1fr) minmax(0, 6fr) auto",
    gap: "0.75rem",
    alignItems: "center"
  },
  weekLabel: {
    fontWeight: 500,
    color: "rgba(226, 232, 240, 0.85)"
  },
  barTrack: {
    display: "flex",
    height: "1.2rem",
    borderRadius: "0.75rem",
    overflow: "hidden",
    background: "rgba(148, 163, 184, 0.18)"
  },
  barSegment: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    flexBasis: 0,
    color: "#0f172a",
    fontWeight: 600
  },
  segmentValue: {
    padding: "0 0.4rem",
    textShadow: "0 1px 2px rgba(15, 23, 42, 0.35)"
  },
  total: {
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem 1rem"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.85rem",
    color: "rgba(226, 232, 240, 0.9)"
  },
  legendSwatch: {
    width: "0.75rem",
    height: "0.75rem",
    borderRadius: "0.4rem"
  },
  empty: {
    fontStyle: "italic",
    color: "rgba(148, 163, 184, 0.9)"
  }
};

export const WeeklyStackedBarChart = memo(WeeklyStackedBarChartComponent);
