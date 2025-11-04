"use client";

import React, { useMemo } from "react";
import type { CSSProperties } from "react";
import type { TimeSummary, TimeSummaryGroup } from "../lib/gitlab";
import { secondsToHours } from "../lib/gitlab";

interface Props {
  summary: TimeSummary;
  /** When true, render a Total column at the end */
  includeTotal?: boolean;
}

export const TeamWorkTable = ({ summary, includeTotal = false }: Props) => {
  // Use a specific ordered set of categories requested by the user.
  const ORDERED_CATEGORIES = [
    "Projektmanagement",
    "Requirements Engineering",
    "Implementierung und Test",
    "Softwareentwurf",
  ];

  const labels = useMemo(() => {
    const available = new Set(summary.byLabel.map((g) => g.label));
    // Keep only the categories we care about, in the requested order.
    const ordered = ORDERED_CATEGORIES.filter((cat) => available.has(cat));
    // If none of the requested categories are present, fall back to all labels.
    return ordered.length ? ordered : summary.byLabel.map((g) => g.label);
  }, [summary]);

  // Build per-user rows and a map of userKey -> { name, totalSeconds, perLabelSeconds }
  const rows = useMemo(() => {
    const map = new Map<string, { name: string; totalSeconds: number; perLabel: Map<string, number> }>();

    // Seed users from byUser (sorted by seconds desc)
    for (const u of summary.byUser) {
      const key = u.hints?.username ?? u.label;
      map.set(key, { name: u.label, totalSeconds: u.seconds, perLabel: new Map() });
    }

    // Walk labelByUser to collect per-label per-user seconds
    for (const labelEntry of summary.labelByUser) {
      const label = labelEntry.label;
      for (const userTotal of labelEntry.totals) {
        const key = userTotal.username || userTotal.userId;
        const entry = map.get(key) ?? { name: userTotal.userName, totalSeconds: 0, perLabel: new Map<string, number>() };
        entry.perLabel.set(label, (entry.perLabel.get(label) ?? 0) + userTotal.seconds);
        // ensure totalSeconds is set (fallback if user wasn't in byUser)
        entry.totalSeconds = entry.totalSeconds || userTotal.seconds;
        map.set(key, entry);
      }
    }

    // Convert to array and sort by totalSeconds desc
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => (b.totalSeconds ?? 0) - (a.totalSeconds ?? 0));
  }, [summary]);

  if (!rows.length) {
    return <p style={styles.empty}>No contributor data available.</p>;
  }

  return (
    <div style={styles.wrapper}>
      <h3 style={styles.title}>Team work by category</h3>
      <div style={styles.table}>
        <div style={{ ...styles.row, ...styles.head }}>
          <div style={{ ...styles.cell, flex: 2 }}>Person</div>
          {labels.map((label) => (
            <div key={label} style={{ ...styles.cell, minWidth: 90 }}>
              {label}
            </div>
          ))}
          {includeTotal ? (
            <div style={{ ...styles.cell, minWidth: 90, textAlign: "right" }}>Total</div>
          ) : null}
        </div>
        {rows.map((row) => {
          const totalSeconds = row.totalSeconds ?? 0;
          return (
            <div key={row.key} style={styles.row}>
              <div style={{ ...styles.cell, flex: 2 }}>{row.name}</div>
              {labels.map((label) => {
                const seconds = row.perLabel.get(label) ?? 0;
                return (
                  <div key={label} style={{ ...styles.cell, minWidth: 90 }}>
                    {seconds > 0 ? `${secondsToHours(seconds).toFixed(1)}h` : "—"}
                  </div>
                );
              })}
              {includeTotal ? (
                <div style={{ ...styles.cell, minWidth: 90, textAlign: "right" }}>
                  {secondsToHours(totalSeconds).toFixed(1)}h
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  wrapper: {
    background: "rgba(15, 23, 42, 0.55)",
    borderRadius: "0.9rem",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    padding: "1rem",
  },
  title: {
    margin: "0 0 0.5rem 0",
    fontSize: "1.05rem",
  },
  table: {
    display: "grid",
    gap: "0.4rem",
  },
  row: {
    display: "flex",
    gap: "0.6rem",
    padding: "0.5rem",
    alignItems: "center",
    borderRadius: "0.6rem",
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.06)",
  },
  head: {
    background: "rgba(148, 163, 184, 0.06)",
    textTransform: "uppercase",
    fontSize: "0.8rem",
    letterSpacing: "0.06em",
    color: "rgba(148, 163, 184, 0.9)",
  },
  cell: {
    flex: 1,
    minWidth: 60,
    fontSize: "0.95rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  empty: {
    fontStyle: "italic",
    color: "rgba(148, 163, 184, 0.9)",
  },
};

export default TeamWorkTable;
