"use client";

import { Fragment, memo, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { COLORS } from "../config/tracker-config";
import type { CommitActivityDay, CommitInfo } from "../lib/gitlab";

interface CommitActivityChartProps {
  data: CommitActivityDay[];
  monthLabel?: string;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CommitActivityChartComponent = ({
  data,
  monthLabel,
}: CommitActivityChartProps) => {
  const [hoveredCell, setHoveredCell] = useState<{
    day: CommitActivityDay;
    x: number;
    y: number;
  } | null>(null);
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
        month: "short",
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
    "#216e39",
  ];

  const columns = prepared.weeks.length;

  return (
    <div style={styles.wrapper}>
      {monthLabel ? <span style={styles.caption}>{monthLabel}</span> : null}
      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: `auto repeat(${columns}, minmax(0, 1fr))`,
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
                    ),
                  }}
                  title={`${cell.date}: ${cell.count} commit${
                    cell.count === 1 ? "" : "s"
                  }`}
                  onMouseEnter={(e) => {
                    if (cell.commits && cell.commits.length > 0) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredCell({
                        day: cell,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <div style={styles.legend}>
        <span style={styles.legendLabel}>Less</span>
        <div style={styles.legendScale}>
          {colorScale.map((color: string) => (
            <span
              key={color}
              style={{
                ...styles.legendSwatch,
                backgroundColor: color,
              }}
            />
          ))}
        </div>
        <span style={styles.legendLabel}>More</span>
      </div>
      {hoveredCell && <CommitTooltip hoveredCell={hoveredCell} />}
    </div>
  );
};

interface CommitTooltipProps {
  hoveredCell: {
    day: CommitActivityDay;
    x: number;
    y: number;
  };
}

const CommitTooltip = ({ hoveredCell }: CommitTooltipProps) => {
  const { day, x, y } = hoveredCell;
  const { date, count, commits = [] } = day;

  if (count === 0 || commits.length === 0) {
    return null;
  }

  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        ...styles.tooltip,
        left: x,
        top: y,
        transform: "translateX(-50%) translateY(-100%)",
      }}
    >
      <div style={styles.tooltipHeader}>
        <strong>{formattedDate}</strong>
        <span style={styles.tooltipCount}>
          {count} commit{count === 1 ? "" : "s"}
        </span>
      </div>
      <div style={styles.tooltipCommits}>
        {commits.slice(0, 5).map((commit) => (
          <div key={commit.id} style={styles.tooltipCommit}>
            <div style={styles.tooltipCommitTitle}>
              <a
                href={commit.web_url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.tooltipCommitLink}
              >
                {commit.short_id}
              </a>
              <span style={styles.tooltipCommitTitleText}>{commit.title}</span>
            </div>
            <div style={styles.tooltipCommitAuthor}>
              by {commit.author_name}
            </div>
          </div>
        ))}
        {commits.length > 5 && (
          <div style={styles.tooltipMore}>
            + {commits.length - 5} more commit
            {commits.length - 5 === 1 ? "" : "s"}
          </div>
        )}
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
    gap: "0.75rem",
  },
  caption: {
    fontSize: "0.9rem",
    color: "rgba(226, 232, 240, 0.75)",
  },
  grid: {
    display: "grid",
    gap: "0.3rem",
    alignItems: "center",
  },
  weekLabel: {
    fontSize: "0.75rem",
    color: "rgba(148, 163, 184, 0.85)",
    textAlign: "center",
  },
  weekday: {
    fontSize: "0.75rem",
    color: "rgba(148, 163, 184, 0.85)",
  },
  cell: {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: "0.25rem",
  },
  emptyCell: {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: "0.25rem",
    background: "rgba(148, 163, 184, 0.1)",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.75rem",
    color: "rgba(148, 163, 184, 0.85)",
  },
  legendScale: {
    display: "flex",
    gap: "0.35rem",
  },
  legendSwatch: {
    width: "1.25rem",
    height: "0.65rem",
    borderRadius: "0.35rem",
  },
  legendLabel: {
    whiteSpace: "nowrap",
  },
  empty: {
    fontStyle: "italic",
    color: "rgba(148, 163, 184, 0.9)",
  },
  tooltip: {
    position: "fixed" as const,
    zIndex: 1000,
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "0.5rem",
    padding: "0.75rem",
    maxWidth: "320px",
    fontSize: "0.875rem",
    color: "#f1f5f9",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
  },
  tooltipHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
  },
  tooltipCount: {
    fontSize: "0.75rem",
    color: "rgba(148, 163, 184, 0.8)",
    fontWeight: "normal" as const,
  },
  tooltipCommits: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  tooltipCommit: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
  tooltipCommitTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  tooltipCommitLink: {
    color: "#60a5fa",
    textDecoration: "none",
    fontFamily: "monospace",
    fontSize: "0.75rem",
    fontWeight: "bold" as const,
    flexShrink: 0,
  },
  tooltipCommitTitleText: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    fontSize: "0.8rem",
  },
  tooltipCommitAuthor: {
    fontSize: "0.7rem",
    color: "rgba(148, 163, 184, 0.7)",
    marginLeft: "0.25rem",
  },
  tooltipMore: {
    fontSize: "0.75rem",
    color: "rgba(148, 163, 184, 0.6)",
    fontStyle: "italic",
    textAlign: "center" as const,
    paddingTop: "0.25rem",
    borderTop: "1px solid rgba(148, 163, 184, 0.1)",
  },
};

export const CommitActivityChart = memo(CommitActivityChartComponent);
