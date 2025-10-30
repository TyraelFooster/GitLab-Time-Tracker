"use client";

import { Fragment, memo, useMemo } from "react";
import type { CSSProperties } from "react";
import { COLORS } from "../config/tracker-config";
import type { CommitActivityDay } from "../lib/gitlab";

interface CommitActivityChartProps {
  data: CommitActivityDay[];
  monthLabel?: string;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CommitActivityChartComponent = ({
  data,
  monthLabel
}: CommitActivityChartProps) => {
  const prepared = useMemo(() => {
    if (!data.length) {
      return null;
    }

    const firstDay = new Date(`${data[0].date}T00:00:00Z`);
    const offset = toMondayIndex(firstDay);
    const cells: Array<CommitActivityDay | null> = [];
    for (let i = 0; i < offset; i += 1) {
      cells.push(null);
    }
    for (const day of data) {
      cells.push(day);
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    const weeks: Array<Array<CommitActivityDay | null>> = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    const weekLabels = weeks.map((week, index) => {
      const first = week.find((cell) => cell !== null);
      if (!first) {
        return `W${index + 1}`;
      }
      const parsed = new Date(`${first.date}T00:00:00Z`);
      return parsed.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short"
      });
    });
    const max = Math.max(...data.map((day) => day.count), 0);
    return { weeks, weekLabels, max };
  }, [data]);

  if (!prepared) {
    return <p style={styles.empty}>No commits recorded for this month.</p>;
  }

  const colorScale = COLORS.HEATMAP ?? [
    "#ebedf0",
    "#9be9a8",
    "#40c463",
    "#30a14e",
    "#216e39"
  ];

  const columns = prepared.weeks.length;

  return (
    <div style={styles.wrapper}>
      {monthLabel ? <span style={styles.caption}>{monthLabel}</span> : null}
      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: `auto repeat(${columns}, minmax(0, 1fr))`
        }}
      >
        <span />
        {prepared.weekLabels.map((label, index) => (
          <span key={`${label}-${index}`} style={styles.weekLabel}>
            {label}
          </span>
        ))}
        {WEEKDAY_LABELS.map((weekday, rowIndex) => (
          <Fragment key={`weekday-${weekday}`}>
            <span style={styles.weekday}>{weekday}</span>
            {prepared.weeks.map((week, columnIndex) => {
              const cell = week[rowIndex];
              const key = `${columnIndex}-${rowIndex}`;
              if (!cell) {
                return <span key={key} style={styles.emptyCell} />;
              }
              return (
                <span
                  key={key}
                  style={{
                    ...styles.cell,
                    backgroundColor: colorForValue(
                      cell.count,
                      prepared.max,
                      colorScale
                    )
                  }}
                  title={`${cell.date}: ${cell.count} commit${
                    cell.count === 1 ? "" : "s"
                  }`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <div style={styles.legend}>
        <span style={styles.legendLabel}>Less</span>
        <div style={styles.legendScale}>
          {colorScale.map((color) => (
            <span
              key={color}
              style={{
                ...styles.legendSwatch,
                backgroundColor: color
              }}
            />
          ))}
        </div>
        <span style={styles.legendLabel}>More</span>
      </div>
    </div>
  );
};

function toMondayIndex(date: Date): number {
  const sundayFirst = date.getUTCDay(); // 0 sunday
  return (sundayFirst + 6) % 7;
}

function colorForValue(
  value: number,
  max: number,
  scale: readonly string[]
): string {
  if (max <= 0) {
    return scale[0];
  }
  if (value <= 0) {
    return scale[0];
  }
  if (scale.length === 1) {
    return scale[0];
  }
  const step = max / (scale.length - 1);
  const index = Math.min(scale.length - 1, Math.floor(value / step) + 1);
  return scale[index];
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: "0.75rem"
  },
  caption: {
    fontSize: "0.9rem",
    color: "rgba(226, 232, 240, 0.75)"
  },
  grid: {
    display: "grid",
    gap: "0.3rem",
    alignItems: "center"
  },
  weekLabel: {
    fontSize: "0.75rem",
    color: "rgba(148, 163, 184, 0.85)",
    textAlign: "center"
  },
  weekday: {
    fontSize: "0.75rem",
    color: "rgba(148, 163, 184, 0.85)"
  },
  cell: {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: "0.25rem"
  },
  emptyCell: {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: "0.25rem",
    background: "rgba(148, 163, 184, 0.1)"
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.75rem",
    color: "rgba(148, 163, 184, 0.85)"
  },
  legendScale: {
    display: "flex",
    gap: "0.35rem"
  },
  legendSwatch: {
    width: "1.25rem",
    height: "0.65rem",
    borderRadius: "0.35rem"
  },
  legendLabel: {
    whiteSpace: "nowrap"
  },
  empty: {
    fontStyle: "italic",
    color: "rgba(148, 163, 184, 0.9)"
  }
};

export const CommitActivityChart = memo(CommitActivityChartComponent);
