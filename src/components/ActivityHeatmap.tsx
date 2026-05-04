"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, TrendingUp, Calendar } from "lucide-react";

interface Props {
  events: any[];
}

interface DayData {
  date: Date;
  count: number;
  dateStr: string;
  dayOfWeek: number;
}

export default function ActivityHeatmap({ events }: Props) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Build 90-day heatmap data (GitHub-style: 13 weeks)
  const { days, weeks, maxCount, stats } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const numDays = 91; // 13 weeks

    const daysList: DayData[] = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = events.filter(e => {
        const eventDate = new Date(e.date ?? e.createdAt ?? 0);
        return eventDate >= d && eventDate < nextDay;
      }).length;

      daysList.push({
        date: d,
        count,
        dateStr: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        dayOfWeek: d.getDay(),
      });
    }

    // Group into weeks (columns)
    const weeksList: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Pad the first week with empty slots if it doesn't start on Sunday
    const firstDay = daysList[0];
    if (firstDay) {
      for (let i = 0; i < firstDay.dayOfWeek; i++) {
        currentWeek.push({ date: new Date(0), count: -1, dateStr: "", dayOfWeek: i });
      }
    }

    for (const day of daysList) {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weeksList.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    if (currentWeek.length > 0) weeksList.push(currentWeek);

    const maxC = Math.max(1, ...daysList.map(d => d.count));

    // Stats
    const activeDays = daysList.filter(d => d.count > 0).length;
    const totalActivities = daysList.reduce((sum, d) => sum + d.count, 0);

    // Current streak
    let streak = 0;
    for (let i = daysList.length - 1; i >= 0; i--) {
      if (daysList[i].count > 0) streak++;
      else break;
    }

    // Best streak
    let bestStreak = 0;
    let tempStreak = 0;
    for (const d of daysList) {
      if (d.count > 0) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      days: daysList,
      weeks: weeksList,
      maxCount: maxC,
      stats: { activeDays, totalActivities, streak, bestStreak },
    };
  }, [events]);

  const getIntensityColor = (count: number) => {
    if (count <= 0) return { bg: "var(--bg-secondary)", opacity: 1, border: "var(--border)" };
    const ratio = count / maxCount;
    if (ratio <= 0.25) return { bg: "var(--accent-primary)", opacity: 0.3, border: "transparent" };
    if (ratio <= 0.5) return { bg: "var(--accent-primary)", opacity: 0.5, border: "transparent" };
    if (ratio <= 0.75) return { bg: "var(--accent-primary)", opacity: 0.75, border: "transparent" };
    return { bg: "var(--accent-primary)", opacity: 1, border: "transparent" };
  };

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_LABELS = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      for (const day of week) {
        if (day.count === -1) continue;
        const m = day.date.getMonth();
        if (m !== lastMonth) {
          labels.push({ label: day.date.toLocaleDateString("en-US", { month: "short" }), weekIndex: wi });
          lastMonth = m;
        }
        break;
      }
    });
    return labels;
  }, [weeks]);

  const handleMouseEnter = (day: DayData, e: React.MouseEvent) => {
    if (day.count === -1) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredDay(day);
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  return (
    <div
      className="rounded-2xl p-5 sm:p-6"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(124,144,130,0.15)" }}
          >
            <Calendar size={16} style={{ color: "var(--accent-primary)" }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Activity Heatmap
            </h3>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
              Last 90 days
            </p>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-4">
          {stats.streak > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame size={14} style={{ color: "var(--accent-tertiary)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--accent-tertiary)" }}>
                {stats.streak} day streak
              </span>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1.5">
            <TrendingUp size={14} style={{ color: "var(--accent-secondary)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--accent-secondary)" }}>
              {stats.activeDays} active days
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto custom-scrollbar pb-1">
        <div className="inline-flex flex-col gap-0" style={{ minWidth: "fit-content" }}>
          {/* Month labels row */}
          <div className="flex ml-8 mb-1.5">
            {MONTH_LABELS.map(({ label, weekIndex }, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold"
                style={{
                  color: "var(--text-secondary)",
                  position: "relative",
                  left: `${weekIndex * 16}px`,
                  marginRight: i < MONTH_LABELS.length - 1 ? `${(MONTH_LABELS[i + 1]?.weekIndex - weekIndex - 1) * 16}px` : 0,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid: day labels + cells */}
          <div className="flex gap-0">
            {/* Day-of-week labels */}
            <div className="flex flex-col pr-2" style={{ gap: "3px" }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="h-[13px] flex items-center justify-end"
                >
                  {(i === 1 || i === 3 || i === 5) && (
                    <span className="text-[9px] font-medium" style={{ color: "var(--text-secondary)" }}>
                      {label}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex" style={{ gap: "3px" }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: "3px" }}>
                  {week.map((day, di) => {
                    const colors = getIntensityColor(day.count);
                    const isEmpty = day.count === -1;

                    return (
                      <motion.div
                        key={`${wi}-${di}`}
                        className="rounded-[3px] cursor-pointer"
                        style={{
                          width: 13,
                          height: 13,
                          background: isEmpty ? "transparent" : colors.bg,
                          opacity: isEmpty ? 0 : colors.opacity,
                          border: isEmpty ? "none" : `1px solid ${colors.border}`,
                        }}
                        whileHover={!isEmpty ? { scale: 1.4, zIndex: 10 } : {}}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                  {/* Pad remaining if week has fewer than 7 days */}
                  {Array.from({ length: Math.max(0, 7 - week.length) }).map((_, pi) => (
                    <div key={`pad-${pi}`} style={{ width: 13, height: 13 }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-secondary)" }}>
          <span className="font-medium">
            {stats.totalActivities} activities in 90 days
          </span>
          {stats.bestStreak > 1 && (
            <span className="font-medium">
              · Best streak: {stats.bestStreak} days
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>Less</span>
          <div className="flex gap-[3px]">
            {[0, 0.3, 0.5, 0.75, 1].map((v, i) => (
              <div
                key={i}
                className="rounded-[2px]"
                style={{
                  width: 10,
                  height: 10,
                  background: v === 0 ? "var(--bg-secondary)" : "var(--accent-primary)",
                  opacity: v === 0 ? 1 : v,
                  border: v === 0 ? "1px solid var(--border)" : "none",
                }}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>More</span>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="fixed z-[200] pointer-events-none px-3 py-2 rounded-xl text-xs font-bold shadow-xl"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translate(-50%, -100%)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              boxShadow: "0 8px 24px var(--shadow)",
            }}
          >
            <div>{hoveredDay.dateStr}</div>
            <div style={{ color: hoveredDay.count > 0 ? "var(--accent-primary)" : "var(--text-secondary)" }}>
              {hoveredDay.count === 0 ? "No activity" : `${hoveredDay.count} activit${hoveredDay.count === 1 ? "y" : "ies"}`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
