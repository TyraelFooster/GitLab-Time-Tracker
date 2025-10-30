"use client";

import { memo, useMemo, useId } from "react";
import type { CSSProperties } from "react";

export interface AreaDatum {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaDatum[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
}

const DEFAULT_HEIGHT = 220;

const AreaChartComponent = ({
  data,
  height = DEFAULT_HEIGHT,
  strokeColor = "#38bdf8",
  fillColor = "rgba(56, 189, 248, 0.25)"
}: AreaChartProps) => {
  const gradientId = useId();

  const prepared = useMemo(() => {
    if (!data.length) {
      return null;
    }
    const maxValue = Math.max(...data.map((item) => item.value), 1);
    const paddingTop = 10;
    const paddingBottom = 10;
    const usableHeight = 100 - paddingTop - paddingBottom;
    const step = data.length > 1 ? 100 / (data.length - 1) : 0;
    const points = data.map((item, index) => {
      const x = data.length === 1 ? 50 : index * step;
      const y = 100 - paddingBottom - (item.value / maxValue) * usableHeight;
      return { x, y, label: item.label, value: item.value };
    });
    const areaPath = [
      `M ${points[0].x} 100`,
      `L ${points[0].x} ${points[0].y}`,
      ...points.slice(1).map((point) => `L ${point.x} ${point.y}`),
      `L ${points[points.length - 1].x} 100`,
      "Z"
    ].join(" ");

    const linePath = [
      `M ${points[0].x} ${points[0].y}`,
      ...points.slice(1).map((point) => `L ${point.x} ${point.y}`)
    ].join(" ");

    return { points, areaPath, linePath };
  }, [data]);

  if (!prepared) {
    return <p style={styles.empty}>No data to display yet.</p>;
  }

  return (
    <div style={{ ...styles.container, height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.svg}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.9} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path
          d={prepared.areaPath}
          fill={`url(#${gradientId})`}
          stroke="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={prepared.linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
        />
        {prepared.points.map((point) => (
          <circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r={1.8}
            fill="#38bdf8"
          >
            <title>
              {point.label}: {point.value.toFixed(2)}
            </title>
          </circle>
        ))}
        <line
          x1={0}
          x2={100}
          y1={100}
          y2={100}
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={0.6}
        />
      </svg>
      <div style={styles.labels}>
        {prepared.points.map((point) => (
          <span key={point.label} style={styles.label}>
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    width: "100%",
    display: "grid",
    gridTemplateRows: "1fr auto",
    alignItems: "end"
  },
  svg: {
    width: "100%",
    height: "100%",
    overflow: "visible"
  },
  labels: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
    fontSize: "0.75rem",
    gap: "0.25rem",
    color: "rgba(148, 163, 184, 0.8)"
  },
  label: {
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  empty: {
    fontStyle: "italic",
    color: "rgba(148, 163, 184, 0.9)"
  }
};

export const AreaChart = memo(AreaChartComponent);
